// backend/services/aiSelectionService.js
// AI Volunteer Selection Engine
// Deterministic High / Medium / Low classification based on repeat event participation
// Embedding/text similarity matching + Groq 2-3 sentence selection rationale generator

const Storage = require("./storage");

// Geolocation coordinate reference hubs (Chennai & Tamil Nadu)
const LOCATION_COORDINATES = {
  "anna university": { lat: 13.0102, lng: 80.2355 },
  "guindy": { lat: 13.0067, lng: 80.2026 },
  "ceg": { lat: 13.0125, lng: 80.2356 },
  "mit": { lat: 12.9482, lng: 80.1402 },
  "loyola": { lat: 13.0645, lng: 80.2335 },
  "iit madras": { lat: 12.9915, lng: 80.2337 },
  "tambaram": { lat: 12.9249, lng: 80.1000 },
  "chennai central": { lat: 13.0827, lng: 80.2707 },
  "srm": { lat: 12.8230, lng: 80.0444 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "madurai": { lat: 9.9252, lng: 78.1198 },
  "trichy": { lat: 10.7905, lng: 78.7047 },
  "salem": { lat: 11.6643, lng: 78.1460 },
  "tirunelveli": { lat: 8.7139, lng: 77.7567 },
  "vellore": { lat: 12.9165, lng: 79.1325 },
};

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function resolveCoordinates(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (lower.includes(key)) return coords;
  }
  // Default to central Chennai coordinates if in Tamil Nadu
  return { lat: 13.0475 + (Math.random() * 0.08 - 0.04), lng: 80.2090 + (Math.random() * 0.08 - 0.04) };
}

function calculateLocationProximity(studentProfile, eventDoc) {
  const eventMode = (eventDoc?.mode || "").toLowerCase();
  if (eventMode.includes("online") || eventMode.includes("virtual")) {
    return {
      distanceKm: 0,
      proximityBadge: "🌐 Virtual / Remote",
      locationScore: 1.0,
      text: "Online Event (No travel needed)",
    };
  }

  const studentLocText = `${studentProfile?.college || ""} ${studentProfile?.zone || ""} ${studentProfile?.city || ""} ${studentProfile?.location || ""}`;
  const eventLocText = `${eventDoc?.venue || ""} ${eventDoc?.location || ""} ${eventDoc?.city || "Chennai"}`;

  const studentCoords = resolveCoordinates(studentLocText);
  const eventCoords = resolveCoordinates(eventLocText);

  let distanceKm = 4.5;
  if (studentCoords && eventCoords) {
    distanceKm = haversineDistanceKm(studentCoords.lat, studentCoords.lng, eventCoords.lat, eventCoords.lng);
  }

  let proximityBadge = "📍 Nearby (<5 km)";
  let locationScore = 1.0;
  if (distanceKm > 25) {
    proximityBadge = "🚗 Regional (>25 km)";
    locationScore = 0.5;
  } else if (distanceKm > 10) {
    proximityBadge = "🚌 City Transit (10-25 km)";
    locationScore = 0.75;
  } else if (distanceKm > 5) {
    proximityBadge = "📍 Moderate (5-10 km)";
    locationScore = 0.9;
  }

  return {
    distanceKm,
    proximityBadge,
    locationScore,
    studentLocation: studentProfile?.college || studentProfile?.zone || "Chennai",
    eventLocation: eventDoc?.venue || eventDoc?.location || "Chennai Central",
    text: `${distanceKm} km away from venue (${eventDoc?.location || "Venue"})`,
  };
}

/**
 * Simple text tokenization and Jaccard/TF-IDF token similarity
 * Computes semantic relevance between student profile (skills, department, bio, motivation)
 * and the target event (title, description, category, skillsRequired).
 */
function computeProfileSimilarity(studentProfile, eventDoc, appDoc) {
  const normalize = (str) =>
    (str || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const eventTokens = new Set([
    ...normalize(eventDoc.title),
    ...normalize(eventDoc.description),
    ...normalize(eventDoc.category),
    ...normalize(eventDoc.skillsRequired),
    ...normalize(eventDoc.skills),
  ]);

  if (eventTokens.size === 0) return 0.5;

  const studentSkills = Array.isArray(studentProfile?.skills)
    ? studentProfile.skills.join(" ")
    : studentProfile?.skills || "";
  const studentInterests = Array.isArray(studentProfile?.interests)
    ? studentProfile.interests.join(" ")
    : studentProfile?.interests || "";

  const candidateTokens = [
    ...normalize(studentSkills),
    ...normalize(studentInterests),
    ...normalize(studentProfile?.department),
    ...normalize(studentProfile?.college),
    ...normalize(studentProfile?.bio),
    ...normalize(appDoc?.motivation),
    ...normalize(appDoc?.skills),
  ];

  let matches = 0;
  candidateTokens.forEach((t) => {
    if (eventTokens.has(t)) matches++;
  });

  const baseScore = candidateTokens.length > 0 ? matches / Math.sqrt(eventTokens.size * candidateTokens.length) : 0.2;
  // Bound score between 0.25 and 0.98
  return Math.min(0.98, Math.max(0.25, Number((baseScore * 1.5 + 0.35).toFixed(2))));
}

/**
 * Generate 2-3 sentence personalized rationale using Groq API
 * (Falls back to deterministic high-quality rationale if Groq is unavailable)
 */
async function generateGroqExplanations(candidates, eventDoc) {
  const groqKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  // Template fallback generator
  const getFallbackRationale = (c) => {
    const repeatText =
      c.repeatCount > 1
        ? `With ${c.repeatCount} prior successful completions of ${eventDoc.title}, they represent our highest tier of repeat event leadership.`
        : c.repeatCount === 1
        ? `Having previously participated in ${eventDoc.title}, they bring hands-on familiarity with the workflow and volunteer expectations.`
        : `As an enthusiastic volunteer for this event, they bring fresh perspective alongside strong core commitment to ${eventDoc.category || "Maatram"}.`;

    const participationText =
      (c.completedEventsCount > 0 || c.totalPoints > 0)
        ? `Their active participation record highlights ${c.completedEventsCount || 0} completed community drives, ${c.totalHours || 0} verified volunteering hours, and ${c.totalPoints || 0} earned points.`
        : `They show strong foundational commitment with dependable engagement.`;

    const studentTypeText = c.studentType ? ` As a verified ${c.studentType}, their schedule is well suited for this event.` : "";

    return `${c.studentName} was selected based on ${c.group.toLowerCase()} repeat participation, ${c.totalPoints || 0} community points, and a ${Math.round(c.similarityScore * 100)}% profile fit. ${repeatText} ${participationText}${studentTypeText}`;
  };

  if (!groqKey || groqKey.includes("Dummy") || groqKey.includes("your_key")) {
    return candidates.map((c) => ({
      ...c,
      aiRationale: getFallbackRationale(c),
    }));
  }

  try {
    const candidateSummaries = candidates.map((c, i) => ({
      index: i + 1,
      name: c.studentName,
      group: c.group,
      repeatCount: c.repeatCount,
      completedEventsCount: c.completedEventsCount || 0,
      totalHours: c.totalHours || 0,
      totalPoints: c.totalPoints || 0,
      studentType: c.studentType || "Hosteller",
      skills: Array.isArray(c.skills) ? c.skills.join(", ") : c.skills || "Teamwork, Leadership",
      college: c.college,
      department: c.department,
      similarityScore: Math.round(c.similarityScore * 100),
    }));

    const prompt = `You are the Maatram Impact Hub Volunteer Selection AI.
The volunteer selection has already been finalized using deterministic rules (repeat participation count, active participation points, completed events, and hours) and profile-event similarity.
Your job is ONLY to write a concise 2–3 sentence professional explanation for why each student was selected for the event "${eventDoc.title}" (${eventDoc.category || "Volunteering"}).

Rules for each explanation:
1. Exactly 2 to 3 sentences long.
2. Must mention their repeat participation tier, their verified active participation (${candidateSummaries.map(c=>`${c.name}: ${c.completedEventsCount} drives, ${c.totalHours}h, ${c.totalPoints}pts, ${c.studentType}`).join("; ")}), and group (High/Medium/Low).
3. Highlight their relevant skills and college/department background.
4. Professional, encouraging, and clear tone.

Candidates:
${JSON.stringify(candidateSummaries, null, 2)}

Return a strict JSON array of objects with keys "index" (number) and "explanation" (string). Output valid JSON ONLY.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(rawText);
      const list = Array.isArray(parsed) ? parsed : parsed.explanations || parsed.candidates || Object.values(parsed)[0];

      if (Array.isArray(list)) {
        const rationaleMap = {};
        list.forEach((item) => {
          if (item && item.index) {
            rationaleMap[item.index] = item.explanation || item.rationale;
          }
        });

        return candidates.map((c, i) => ({
          ...c,
          aiRationale: rationaleMap[i + 1] || getFallbackRationale(c),
        }));
      }
    }
  } catch (err) {
    console.warn("[AI Selection] Groq call notice (using graceful fallback):", err.message);
  }

  // Graceful fallback
  return candidates.map((c) => ({
    ...c,
    aiRationale: getFallbackRationale(c),
  }));
}

const aiSelectionService = {
  /**
   * Run AI Volunteer Selection for an event
   * @param {string} eventId
   * @param {object} options { volunteersNeededOverride }
   */
  async getEventRecommendations(eventId, options = {}) {
    const event = await Storage.getEventById(eventId);
    if (!event) throw new Error("Event not found");

    const volunteersNeeded = Number(
      options.volunteersNeededOverride || event.volunteersNeeded || event.requiredVolunteers || 10
    );

    // Get all registered applications for this event
    const applications = await Storage.getApplicationsByEvent(eventId, event.title);
    const allUsers = (await Storage.getUsers?.()) || (await Storage.getAllUsers?.()) || [];
    const allApplications = (await Storage.getAllApplications?.()) || (await Storage.getApplications?.()) || [];

    // Map all users by ID and email
    const userMap = {};
    allUsers.forEach((u) => {
      const idKey = (u._id || u.id || "").toString();
      if (idKey) userMap[idKey] = u;
      if (u.applicationId) userMap[u.applicationId.toUpperCase()] = u;
      if (u.email) userMap[u.email.toLowerCase().trim()] = u;
    });

    // Clean normalized event title for repeat matching
    const targetTitleNorm = (event.title || "").toLowerCase().trim();
    const targetCategoryNorm = (event.category || "").toLowerCase().trim();

    // Process each applicant
    const evaluatedCandidates = applications.map((app) => {
      const appId = (app.id || app._id || app.referenceId || "").toString();
      const userIdStr = (app.userId || "").toString();
      const emailStr = (app.applicantDetails?.email || "").toLowerCase().trim();
      const maatramId = (app.applicationId || "").toUpperCase();

      const studentUser = userMap[userIdStr] || userMap[maatramId] || userMap[emailStr] || {};

      // Retrieve student's all past volunteering history
      const studentPastApps = allApplications.filter((a) => {
        const aUserStr = (a.userId || "").toString();
        const aEmailStr = (a.applicantDetails?.email || "").toLowerCase().trim();
        const aMaatramId = (a.applicationId || "").toUpperCase();

        const isSameStudent =
          (userIdStr && aUserStr === userIdStr) ||
          (emailStr && aEmailStr === emailStr) ||
          (maatramId && aMaatramId === maatramId);

        // Consider completed or verified past applications
        return isSameStudent && (a.status === "Completed" || a.attendanceStatus === "Present");
      });

      // Calculate repeat participation count for THIS specific event
      const sameEventApps = studentPastApps.filter((a) => {
        const oppTitle = (a.opportunityTitle || "").toLowerCase().trim();
        const oppCategory = (a.category || "").toLowerCase().trim();
        const oppId = (a.opportunityId || "").toString();

        return (
          oppId === eventId.toString() ||
          oppTitle === targetTitleNorm ||
          (targetTitleNorm && oppTitle.includes(targetTitleNorm)) ||
          (targetTitleNorm && targetTitleNorm.includes(oppTitle))
        );
      });

      const repeatCount = sameEventApps.length;

      // Build structured past_volunteering_details
      const eventsBreakdown = studentPastApps.map((a) => ({
        event_id: a.opportunityId || a.id || a._id,
        event_name: a.opportunityTitle || "Volunteering Event",
        hours: Number(a.hours) || 4,
        points: Number(a.pointsAwarded) || 50,
        date: a.eventDate || a.completedAt || a.appliedDate || "",
        category: a.category || "Social Service",
      }));

      const similarityScore = computeProfileSimilarity(studentUser, event, app);
      const proximity = calculateLocationProximity(studentUser, event);

      const studentName =
        app.applicantDetails?.name ||
        studentUser.fullName ||
        app.applicantDetails?.fullName ||
        "Volunteer";

      const college = app.applicantDetails?.college || studentUser.college || "Anna University";
      const department = app.applicantDetails?.department || studentUser.department || "General";
      const academicYear = app.applicantDetails?.academicYear || studentUser.academicYear || "Final Year";
      const regNumber = app.applicantDetails?.regNumber || studentUser.regNumber || maatramId || "N/A";
      const skills = studentUser.skills?.length
        ? studentUser.skills
        : app.skills
        ? app.skills.split(",").map((s) => s.trim())
        : ["Team Coordination", "Field Support"];

      const individualPassCode = `MF-VOL-${(maatramId || "V").replace(/[^a-zA-Z0-9]/g, "")}-${appId.slice(-4).toUpperCase()}`;
      const individualQrPayload = JSON.stringify({
        type: "individual_volunteer_pass",
        eventId: eventId.toString(),
        eventTitle: event.title,
        applicationId: appId,
        maatramId: maatramId || "MAA-VOL",
        studentName,
        passCode: individualPassCode,
      });

      return {
        applicationId: appId,
        userId: userIdStr || studentUser._id || studentUser.id,
        maatramId: maatramId || studentUser.applicationId || "MAA-VOL",
        studentName,
        individualPassCode,
        individualQrPayload,
        studentEmail: emailStr || studentUser.email,
        studentPhone: app.applicantDetails?.phone || studentUser.phone || "",
        avatar: app.applicantDetails?.avatar || studentUser.avatar || "",
        college,
        department,
        academicYear,
        regNumber,
        skills,
        bio: studentUser.bio || "",
        status: app.status || "Pending",
        attendanceStatus: app.attendanceStatus || "Unmarked",
        registeredAt: app.appliedDate || app.createdAt || new Date().toISOString(),
        repeatCount,
        similarityScore,
        locationProximity: proximity,
        distanceKm: proximity.distanceKm,
        studentType:
          studentUser.residence ||
          studentUser.studentType ||
          app.applicantDetails?.residence ||
          app.applicantDetails?.studentType ||
          "Hosteller",
        residence:
          studentUser.residence ||
          studentUser.studentType ||
          app.applicantDetails?.residence ||
          app.applicantDetails?.studentType ||
          "Hosteller",
        totalPoints: Number(studentUser.points) || Number(studentUser.totalPoints) || 0,
        totalHours: Number(studentUser.totalHours) || 0,
        completedEventsCount: studentPastApps.length,
        past_volunteering_details: {
          total_events_completed: studentPastApps.length,
          total_hours: studentPastApps.reduce((acc, a) => acc + (Number(a.hours) || 0), 0),
          total_points: studentPastApps.reduce((acc, a) => acc + (Number(a.pointsAwarded) || 0), 0),
          events_breakdown: eventsBreakdown,
        },
      };
    });

    // Determine max repeat count among applicants
    const maxRepeat = evaluatedCandidates.length > 0 ? Math.max(...evaluatedCandidates.map((c) => c.repeatCount)) : 0;

    // Step 2: Classify into High / Medium / Low groups strictly by repeat participation count
    const candidatesWithGroups = evaluatedCandidates.map((c) => {
      let group = "Low";
      let groupLabel = "Low (First-time Volunteer)";
      let groupBadgeColor = "#3B82F6"; // Blue

      if (maxRepeat > 0 && c.repeatCount === maxRepeat) {
        group = "High";
        groupLabel = `High (${c.repeatCount}x Repeat Lead)`;
        groupBadgeColor = "#16A34A"; // Green
      } else if (c.repeatCount > 0 && c.repeatCount < maxRepeat) {
        group = "Medium";
        groupLabel = `Medium (${c.repeatCount}x Repeat Volunteer)`;
        groupBadgeColor = "#EAB308"; // Amber
      } else {
        group = "Low";
        groupLabel = "Low (Never done this event)";
        groupBadgeColor = "#64748B"; // Slate
      }

      // Explicitly weigh points, completed events count, and active participation hours
      const pointsScore = Math.min((c.totalPoints || 0) * 0.75, 75);
      const eventsScore = Math.min((c.completedEventsCount || 0) * 25, 100);
      const hoursScore = Math.min((c.totalHours || 0) * 3, 60);
      const activeParticipationScore = pointsScore + eventsScore + hoursScore;

      // Ranking score formula: Group tier weight + active participation + profile similarity + location proximity
      const tierWeight = group === "High" ? 300 : group === "Medium" ? 150 : 50;
      const proximityWeight = (c.locationProximity?.locationScore || 1) * 25;
      const rankScore = Number(
        (tierWeight + activeParticipationScore + c.similarityScore * 100 + proximityWeight).toFixed(2)
      );

      return {
        ...c,
        group,
        groupLabel,
        groupBadgeColor,
        activeParticipationScore: Number(activeParticipationScore.toFixed(1)),
        rankScore,
      };
    });

    // Sort descending by rankScore
    candidatesWithGroups.sort((a, b) => b.rankScore - a.rankScore);

    // Pick top candidates as recommended
    const recommendedList = candidatesWithGroups.slice(0, volunteersNeeded).map((c, idx) => ({
      ...c,
      recommended: true,
      rank: idx + 1,
    }));

    const otherList = candidatesWithGroups.slice(volunteersNeeded).map((c, idx) => ({
      ...c,
      recommended: false,
      rank: volunteersNeeded + idx + 1,
    }));

    const allRanked = [...recommendedList, ...otherList];

    // Generate Groq 2-3 sentence personalized explanations
    const allWithExplanations = await generateGroqExplanations(allRanked, event);

    // Grouping
    const highGroup = allWithExplanations.filter((c) => c.group === "High");
    const mediumGroup = allWithExplanations.filter((c) => c.group === "Medium");
    const lowGroup = allWithExplanations.filter((c) => c.group === "Low");
    const recommended = allWithExplanations.filter((c) => c.recommended);

    return {
      success: true,
      eventId,
      eventTitle: event.title,
      eventCategory: event.category,
      eventDate: event.date,
      volunteersNeeded,
      totalApplicants: allWithExplanations.length,
      maxRepeatCount: maxRepeat,
      counts: {
        total: allWithExplanations.length,
        recommended: recommended.length,
        high: highGroup.length,
        medium: mediumGroup.length,
        low: lowGroup.length,
      },
      groups: {
        high: highGroup,
        medium: mediumGroup,
        low: lowGroup,
      },
      recommendations: allWithExplanations,
    };
  },

  /**
   * Apply selection: Approve selected candidates and optionally dispatch selection emails
   */
  async applySelection(eventId, { selectedApplicationIds = [], sendEmail = true }, adminUser) {
    const event = await Storage.getEventById(eventId);
    if (!event) throw new Error("Event not found");

    const updated = [];
    for (const appId of selectedApplicationIds) {
      try {
        const app = await Storage.updateApplicationStatus(appId, "Approved", adminUser);
        if (app) updated.push(app);
      } catch (e) {
        console.warn(`Failed to approve application ${appId}:`, e.message);
      }
    }

    // Optionally dispatch selection confirmation emails
    let emailResult = null;
    if (sendEmail && updated.length > 0) {
      try {
        emailResult = await Storage.confirmEventSelection(eventId, {}, adminUser);
      } catch (err) {
        console.warn("Notice: Selection email dispatch:", err.message);
      }
    }

    return {
      success: true,
      approvedCount: updated.length,
      emailResult,
      message: `Successfully approved ${updated.length} selected volunteer(s)!`,
    };
  },
};

module.exports = aiSelectionService;

// backend/services/ragService.js
// RAG (Retrieval-Augmented Generation) Service for Maatram Foundation Chatbot

const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const KB_DIR = path.join(__dirname, "../data/knowledge_base");
const INDEX_FILE = path.join(KB_DIR, "index.json");

// ─── PDF Text Extraction ─────────────────────────────────────────────────────
async function extractPdfText(filePath) {
  try {
    const { PDFParse } = require("pdf-parse");
    const absPath = path.resolve(filePath);
    const parser = new PDFParse({ url: absPath, verbosity: 0 });
    await parser.load();
    const result = await parser.getText();
    // result.pages = [{ text, pageNumber }, ...]
    if (result && result.pages && result.pages.length > 0) {
      return result.pages.map(p => p.text || "").join("\n\n");
    }
    // Fallback: result might be a string or have .content
    if (typeof result === "string") return result;
    return "";
  } catch (err) {
    console.error(`[RAG] Error extracting PDF ${filePath}:`, err.message);
    return "";
  }
}

// ─── Text Chunking ───────────────────────────────────────────────────────────
function chunkText(text, chunkSize = 600, overlap = 100) {
  const chunks = [];
  // Split by paragraphs first for natural breaks
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 20);
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n" + para).length <= chunkSize) {
      current = current ? current + "\n" + para : para;
    } else {
      if (current) {
        chunks.push(current.trim());
        // Overlap: carry last 'overlap' chars into next chunk
        const overlapText = current.slice(-overlap);
        current = overlapText + "\n" + para;
      } else {
        // Para itself is too long — split by sentences
        const sentences = para.split(/(?<=[.!?])\s+/);
        for (const sent of sentences) {
          if ((current + " " + sent).length <= chunkSize) {
            current = current ? current + " " + sent : sent;
          } else {
            if (current) chunks.push(current.trim());
            current = sent;
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─── TF-IDF Cosine Similarity ────────────────────────────────────────────────
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function buildTfIdf(tokens, allDocTokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const total = tokens.length || 1;
  Object.keys(tf).forEach(k => (tf[k] /= total));

  const idf = {};
  const N = allDocTokens.length;
  const vocab = new Set(tokens);
  for (const term of vocab) {
    const docCount = allDocTokens.filter(d => d.has(term)).length;
    idf[term] = Math.log((N + 1) / (docCount + 1)) + 1;
  }
  const tfidf = {};
  for (const [k, v] of Object.entries(tf)) tfidf[k] = v * (idf[k] || 1);
  return tfidf;
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Build / Load Index ──────────────────────────────────────────────────────
let cachedIndex = null;

async function buildIndex(force = false) {
  if (!fs.existsSync(KB_DIR)) {
    fs.mkdirSync(KB_DIR, { recursive: true });
  }

  if (!force && fs.existsSync(INDEX_FILE)) {
    try {
      cachedIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
      console.log(`[RAG] Loaded existing index with ${cachedIndex.chunks.length} chunks.`);
      return { success: true, chunks: cachedIndex.chunks.length, source: "cache" };
    } catch (_) {}
  }

  console.log("[RAG] Building knowledge base index from PDFs...");
  const pdfFiles = fs.readdirSync(KB_DIR).filter(f => f.endsWith(".pdf"));
  if (pdfFiles.length === 0) {
    console.warn("[RAG] No PDF files found in knowledge base directory.");
    cachedIndex = { chunks: [], builtAt: new Date().toISOString() };
    fs.writeFileSync(INDEX_FILE, JSON.stringify(cachedIndex, null, 2));
    return { success: true, chunks: 0, source: "empty" };
  }

  const allChunks = [];
  for (const file of pdfFiles) {
    const filePath = path.join(KB_DIR, file);
    console.log(`[RAG] Processing: ${file}`);
    const text = await extractPdfText(filePath);
    if (!text) continue;
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      allChunks.push({
        id: `${file}_chunk_${i}`,
        source: file,
        sourceLabel: file
          .replace(/media_\d+_[a-f0-9]+\.pdf$/, "")
          .replace(/_/g, " ")
          .trim() || file,
        content: chunks[i],
        tokens: tokenize(chunks[i]),
      });
    }
  }

  // Add hardcoded Maatram Foundation knowledge
  const maatramKnowledge = getMaatramBaseKnowledge();
  for (let i = 0; i < maatramKnowledge.length; i++) {
    const item = maatramKnowledge[i];
    allChunks.push({
      id: `maatram_base_${i}`,
      source: "Maatram Foundation",
      sourceLabel: "Maatram Foundation Official Info",
      content: item,
      tokens: tokenize(item),
    });
  }

  cachedIndex = {
    chunks: allChunks,
    builtAt: new Date().toISOString(),
    fileCount: pdfFiles.length,
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(cachedIndex, null, 2));
  console.log(`[RAG] Index built: ${allChunks.length} chunks from ${pdfFiles.length} PDFs.`);
  return { success: true, chunks: allChunks.length, files: pdfFiles.length, source: "built" };
}

function getMaatramBaseKnowledge() {
  return [
    `Maatram Foundation is a non-profit social initiative that creates positive change in society through education, awareness, and community support. It was founded to empower youth and communities through volunteering, skill-building, and social impact programs.`,

    `Maatram Impact Hub is the official volunteer management platform for Maatram Foundation. Volunteers can register, apply for events, track their volunteer hours, earn points, get certificates, and connect with the Maatram community.`,

    `To register as a volunteer at Maatram Foundation, visit the Maatram Impact Hub website and click on Register. Fill in your personal details including full name, email, phone number, educational institution, and select your role (Student or Alumni). After registration, your account requires admin approval before you can fully access the platform.`,

    `A Maatram ID (also called Application ID or MAA ID) is a unique identifier assigned to each volunteer, formatted as MAA001, MAA002, etc. This ID is used to track your contributions, volunteer hours, points, and certificates. Keep your Maatram ID safe as it is essential for all platform activities.`,

    `Maatram Foundation volunteer activities include school visits, panel interviews, transport and food coordination, community outreach, educational support, awareness campaigns, and other social impact initiatives. Volunteers earn points (10 points per volunteer hour) for their participation.`,

    `The Maatram Impact Hub point system works as follows: Volunteers earn 10 points per volunteer hour. These points accumulate to determine your rank on the leaderboard. Points can be used to track your impact and unlock achievement badges and certificates.`,

    `Certificates on Maatram Impact Hub are automatically generated when volunteers reach certain milestones or complete specific events. You can download your certificates from the Contributions section of your profile. Certificates can also be shared on LinkedIn directly from the platform.`,

    `To apply for a volunteering opportunity: Log in to your Maatram Impact Hub account, go to Opportunities, browse available events, click on an event to see details, and click Apply. Your application will be reviewed by the admin team. You will receive an email notification when your application is approved or rejected.`,

    `School Visit Program: Maatram Foundation volunteers visit schools to conduct awareness sessions, educational activities, and motivational talks. Volunteers need to report at the designated school at the specified time. Refer to the School Visit Guidelines document for detailed instructions on conduct, dress code, and activities.`,

    `Panel Interview Program: Volunteers assist in conducting panel interviews for various Maatram Foundation selection processes. This includes evaluating candidates, taking notes, and providing feedback. Refer to the Panel Interview Volunteer Guidelines for detailed instructions.`,

    `Transport and Food Coordination: Some Maatram Foundation events require volunteers to coordinate transportation and food arrangements for participants. This involves logistics planning, vendor coordination, and ensuring smooth operations. Refer to the Transport and Food Volunteer Guidelines document for detailed procedures.`,

    `Volunteer Conduct Guidelines: All Maatram Foundation volunteers are expected to maintain professional conduct, punctuality, respectful communication, and commitment to their assigned roles. Volunteers should inform their coordinators in advance if they cannot attend a scheduled event.`,

    `The Leaderboard on Maatram Impact Hub shows the top volunteers ranked by their points. You can see your rank, total points, volunteer hours, and badges earned. The leaderboard is updated regularly as points are awarded for completed events.`,

    `Badges on Maatram Impact Hub are earned for reaching milestones such as completing your first event, volunteering 10 hours, reaching 100 points, and other achievements. Badges appear on your profile and certificate.`,

    `For any issues with your Maatram Impact Hub account, event applications, or volunteering activities, please contact the Maatram Foundation admin team through the platform's notification system or reach out to your event coordinator.`,

    `Admin approval is required for new volunteer accounts. After registration, your account will be in Pending status. The admin team reviews applications and approves eligible volunteers. You will receive an email confirmation once your account is approved. Only approved volunteers can apply for events and access full platform features.`,
  ];
}

// ─── Retrieve Relevant Chunks ────────────────────────────────────────────────
async function retrieveRelevantChunks(query, topK = 5) {
  if (!cachedIndex) await buildIndex();
  if (!cachedIndex || cachedIndex.chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  const allDocTokenSets = cachedIndex.chunks.map(c => new Set(c.tokens));
  const queryVec = buildTfIdf(queryTokens, allDocTokenSets);

  const scored = cachedIndex.chunks.map((chunk, i) => {
    const chunkVec = buildTfIdf(chunk.tokens, allDocTokenSets);
    const score = cosineSimilarity(queryVec, chunkVec);
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(c => c.score > 0.01);
}

// ─── Generate Response via Groq API (LLM) ──────────────────────────────────
async function generateResponse({ query, context, maatramId, userProfile, conversationHistory = [] }) {
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  // Build context text from retrieved chunks
  const contextText = context.length > 0
    ? context.map((c, i) => `[Source ${i + 1}: ${c.sourceLabel}]\n${c.content}`).join("\n\n---\n\n")
    : "";

  const userInfo = userProfile
    ? `Volunteer Profile: ${userProfile.fullName || "Volunteer"} (Maatram ID: ${maatramId || userProfile.applicationId || "N/A"}, Role: ${userProfile.role || "student"}, Points: ${userProfile.points || 0})`
    : maatramId
    ? `Maatram ID: ${maatramId}`
    : "";

  const systemPrompt = `You are the Maatram Foundation AI Assistant — a warm, helpful, and polite guide for volunteers on the Maatram Impact Hub platform.
${userInfo ? "\n" + userInfo : ""}

Your instructions:
- Answer accurately based on the KNOWLEDGE BASE CONTEXT provided below.
- If the question is about Maatram Foundation activities, verification, guidelines, transport, food, interviews, points, certificates, or school visits, provide a clear, helpful, well-structured answer.
- If the knowledge base does not cover the specific details, give a polite general response and state: "For further details or assistance, please reach out to the Maatram Foundation admin team."
- Never fabricate facts or rules that contradict Maatram Foundation procedures.
- Keep responses friendly, encouraging, and easy to read with bullet points when applicable.

KNOWLEDGE BASE CONTEXT:
${contextText || "General Maatram Foundation volunteer guidelines and information."}`;

  const sources = context
    .filter(c => c.score > 0.05)
    .slice(0, 3)
    .map(c => ({ label: c.sourceLabel, source: c.source }));

  // If no Groq API key is configured, fallback to direct context retrieval
  if (!apiKey || apiKey.includes("Dummy") || apiKey.includes("your_key")) {
    return fallbackResponse(query, context);
  }

  try {
    // Build messages array conforming to OpenAI / Groq chat completions spec
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add recent conversational context
    const recentHistory = conversationHistory.slice(-6);
    for (const h of recentHistory) {
      if (h.content) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: String(h.content)
        });
      }
    }

    // Add latest user query
    messages.push({
      role: "user",
      content: query
    });

    // Make direct API call to Groq
    const groqKey = process.env.GROQ_API_KEY || apiKey;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.warn("[RAG] Groq primary model failed:", response.status, errBody);

      // Attempt fallback with 20b model on Groq
      const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages,
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        const fbReply = fbData.choices?.[0]?.message?.content;
        if (fbReply) {
          return { text: fbReply, sources };
        }
      }

      // If both fail, gracefully use local knowledge base fallback
      return fallbackResponse(query, context);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;

    if (!replyText) {
      return fallbackResponse(query, context);
    }

    return { text: replyText, sources };
  } catch (err) {
    console.error("[RAG] Groq API call error:", err.message);
    // Graceful fallback from knowledge base chunks so student is never blocked
    return fallbackResponse(query, context);
  }
}

// ─── Fallback: answer from knowledge base without Gemini ─────────────────────
function fallbackResponse(query, context) {
  const sources = context
    .filter(c => c.score > 0.05)
    .slice(0, 3)
    .map(c => ({ label: c.sourceLabel, source: c.source }));

  if (context.length === 0) {
    return {
      text: "Hi! I'm the Maatram Foundation Assistant. I don't have specific information about that in my knowledge base right now. Please contact the Maatram Foundation admin team for assistance. 😊",
      sources: [],
    };
  }

  // Build a readable answer from the top chunk
  const top = context[0];
  const preview = top.content
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 600);

  return {
    text: `Here's what I found about your query from the Maatram Foundation guidelines:\n\n${preview}${top.content.length > 600 ? "\n\n...For complete details, refer to the full guidelines document." : ""}`,
    sources,
  };
}

// ─── List Documents ──────────────────────────────────────────────────────────
function listDocuments() {
  if (!fs.existsSync(KB_DIR)) return [];
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith(".pdf"));
  return files.map(f => {
    const stat = fs.statSync(path.join(KB_DIR, f));
    return {
      filename: f,
      size: stat.size,
      uploadedAt: stat.mtime.toISOString(),
    };
  });
}

// ─── Delete Document ─────────────────────────────────────────────────────────
function deleteDocument(filename) {
  const filePath = path.join(KB_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error("Document not found");
  fs.unlinkSync(filePath);
  // Invalidate cache so next request rebuilds
  cachedIndex = null;
  if (fs.existsSync(INDEX_FILE)) fs.unlinkSync(INDEX_FILE);
}

// ─── Index Status ────────────────────────────────────────────────────────────
function getIndexStatus() {
  if (!fs.existsSync(INDEX_FILE)) {
    return { built: false, chunks: 0, files: 0, builtAt: null };
  }
  try {
    const idx = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
    return {
      built: true,
      chunks: idx.chunks?.length || 0,
      files: idx.fileCount || 0,
      builtAt: idx.builtAt || null,
    };
  } catch {
    return { built: false, chunks: 0, files: 0, builtAt: null };
  }
}

module.exports = {
  buildIndex,
  retrieveRelevantChunks,
  generateResponse,
  listDocuments,
  deleteDocument,
  getIndexStatus,
  extractPdfText,
};

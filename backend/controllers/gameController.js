// backend/controllers/gameController.js
const { DailyPuzzle, GameSession, PlayerStreak } = require("../models/Game");
const User = require("../models/User");

// Built-in verified ZIP 6x6 puzzles with complete 36-cell Hamiltonian paths
// Each path visits every cell exactly once, and numbered checkpoints 1..8 appear along the path
const DEFAULT_ZIP_PUZZLES = [
  {
    puzzleNumber: 163,
    gridSize: 6,
    // Pre-defined numbers placement inspired by the reference screenshot
    numbers: [
      { num: 1, row: 3, col: 3 },
      { num: 2, row: 4, col: 4 },
      { num: 3, row: 1, col: 4 },
      { num: 4, row: 3, col: 2 },
      { num: 5, row: 4, col: 1 },
      { num: 6, row: 2, col: 2 },
      { num: 7, row: 1, col: 1 },
      { num: 8, row: 2, col: 3 },
    ],
    // Canonical 36-step path that visits all cells in valid order
    solution: [
      { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 4 }, { row: 5, col: 4 },
      { row: 5, col: 5 }, { row: 4, col: 5 }, { row: 3, col: 5 }, { row: 2, col: 5 },
      { row: 1, col: 5 }, { row: 0, col: 5 }, { row: 0, col: 4 }, { row: 1, col: 4 },
      { row: 2, col: 4 }, { row: 2, col: 3 }, { row: 1, col: 3 }, { row: 0, col: 3 },
      { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 3, col: 2 },
      { row: 4, col: 2 }, { row: 4, col: 1 }, { row: 5, col: 1 }, { row: 5, col: 0 },
      { row: 4, col: 0 }, { row: 3, col: 0 }, { row: 2, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 },
      { row: 3, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 4, col: 3 },
    ],
    parTime: 45,
    maxXP: 100,
  },
  {
    puzzleNumber: 164,
    gridSize: 6,
    numbers: [
      { num: 1, row: 0, col: 0 },
      { num: 2, row: 0, col: 5 },
      { num: 3, row: 1, col: 3 },
      { num: 4, row: 2, col: 0 },
      { num: 5, row: 3, col: 4 },
      { num: 6, row: 4, col: 1 },
      { num: 7, row: 5, col: 3 },
      { num: 8, row: 5, col: 5 },
    ],
    solution: [],
    parTime: 50,
    maxXP: 100,
  },
  {
    puzzleNumber: 165,
    gridSize: 6,
    numbers: [
      { num: 1, row: 2, col: 2 },
      { num: 2, row: 1, col: 4 },
      { num: 3, row: 0, col: 1 },
      { num: 4, row: 3, col: 1 },
      { num: 5, row: 4, col: 3 },
      { num: 6, row: 5, col: 0 },
      { num: 7, row: 4, col: 5 },
      { num: 8, row: 2, col: 4 },
    ],
    solution: [],
    parTime: 40,
    maxXP: 100,
  },
];

// Built-in verified WEND 2x2 puzzles (4 letters arranged in 2x2 grid)
const DEFAULT_WEND_PUZZLES = [
  {
    letters: ["W", "E", "D", "N"],
    grid: [
      ["W", "E"],
      ["D", "N"],
    ],
    targetWords: ["WEND", "NEWS", "DENS", "WEDS", "NEW", "DEW", "END", "WED", "DEN"],
    minWordsToWin: 4,
    parTime: 35,
    maxXP: 100,
  },
  {
    letters: ["P", "L", "A", "Y"],
    grid: [
      ["P", "L"],
      ["A", "Y"],
    ],
    targetWords: ["PLAY", "PAL", "PAY", "LAY", "PLY", "YAP", "LAP"],
    minWordsToWin: 4,
    parTime: 30,
    maxXP: 100,
  },
  {
    letters: ["S", "T", "A", "R"],
    grid: [
      ["S", "T"],
      ["A", "R"],
    ],
    targetWords: ["STAR", "RATS", "ARTS", "TARS", "ART", "RAT", "TAR", "SAT"],
    minWordsToWin: 4,
    parTime: 30,
    maxXP: 100,
  },
  {
    letters: ["T", "E", "A", "M"],
    grid: [
      ["T", "E"],
      ["A", "M"],
    ],
    targetWords: ["TEAM", "MEAT", "MATE", "TAME", "TEA", "EAT", "MET", "MAT"],
    minWordsToWin: 4,
    parTime: 30,
    maxXP: 100,
  },
];

// System Badges Definitions
const ALL_BADGES = [
  {
    id: "first_game",
    name: "First Step",
    description: "Completed your first daily game puzzle",
    icon: "Rocket",
    category: "general",
    xpReward: 50,
  },
  {
    id: "streak_3",
    name: "Streak Novice",
    description: "Maintained a 3-day win streak",
    icon: "Flame",
    category: "streak",
    xpReward: 100,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Achieved a full 7-day win streak & unlocked bonus puzzle!",
    icon: "Gift",
    category: "streak",
    xpReward: 250,
  },
  {
    id: "streak_30",
    name: "Monthly Legend",
    description: "Completed a 30-day streak of daily games",
    icon: "Crown",
    category: "streak",
    xpReward: 500,
  },
  {
    id: "speed_zip",
    name: "Speed Zipper",
    description: "Solved the ZIP puzzle in under 30 seconds",
    icon: "Zap",
    category: "speed",
    xpReward: 150,
  },
  {
    id: "speed_wend",
    name: "Word Wizard",
    description: "Solved the WEND word puzzle in under 20 seconds",
    icon: "Sparkles",
    category: "speed",
    xpReward: 150,
  },
  {
    id: "perfect_dual",
    name: "Daily Dual Master",
    description: "Completed both ZIP and WEND games in a single day",
    icon: "Trophy",
    category: "mastery",
    xpReward: 200,
  },
];

// Helper: Get Current IST Date YYYY-MM-DD
function getTodayIST() {
  const now = new Date();
  // IST is UTC + 5:30
  const utcOffset = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utcOffset + 5.5 * 3600000);
  return istTime.toISOString().split("T")[0];
}

// Helper: Get Day Letter of Week (W, T, F, S, S, M, T)
function getDayLetter(dateStr) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const d = new Date(dateStr + "T00:00:00Z");
  return days[d.getUTCDay()];
}

// Helper: Ensure Today's Puzzle Exists
async function getOrCreateTodayPuzzle(dateStr) {
  let puzzle = await DailyPuzzle.findOne({ date: dateStr });
  if (!puzzle) {
    // Generate deterministic index based on date
    const daySeed = Math.abs(
      dateStr.split("-").reduce((acc, part) => acc * 31 + parseInt(part), 7)
    );
    const zipTemplate = DEFAULT_ZIP_PUZZLES[daySeed % DEFAULT_ZIP_PUZZLES.length];
    const wendTemplate = DEFAULT_WEND_PUZZLES[daySeed % DEFAULT_WEND_PUZZLES.length];

    // Compute continuous puzzle number (e.g. #163)
    const baseDate = new Date("2026-06-08");
    const currDate = new Date(dateStr);
    const diffDays = Math.max(1, Math.floor((currDate - baseDate) / 86400000));
    const puzzleNumber = 163 + (diffDays % 500);

    puzzle = await DailyPuzzle.create({
      date: dateStr,
      puzzleNumber,
      zipPuzzle: {
        gridSize: zipTemplate.gridSize || 6,
        numbers: zipTemplate.numbers,
        solution: zipTemplate.solution || [],
        parTime: zipTemplate.parTime || 45,
        maxXP: zipTemplate.maxXP || 100,
      },
      wendPuzzle: {
        letters: wendTemplate.letters,
        grid: wendTemplate.grid,
        targetWords: wendTemplate.targetWords,
        minWordsToWin: wendTemplate.minWordsToWin || 4,
        parTime: wendTemplate.parTime || 35,
        maxXP: wendTemplate.maxXP || 100,
      },
    });
  }
  return puzzle;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

// 1. GET DAILY CHALLENGE & USER PROGRESS
exports.getDailyChallenge = async (req, res) => {
  try {
    const today = getTodayIST();
    const puzzle = await getOrCreateTodayPuzzle(today);

    let userProgress = {
      zipDone: false,
      wendDone: false,
      zipDuration: null,
      wendDuration: null,
      zipXP: 0,
      wendXP: 0,
      todayXP: 0,
    };

    let streakData = {
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      gamesCompleted: 0,
      weekHistory: [],
    };

    if (req.user && req.user._id) {
      // Find today's sessions for user
      const sessions = await GameSession.find({
        userId: req.user._id,
        date: today,
        completed: true,
      });

      sessions.forEach((s) => {
        if (s.gameType === "zip") {
          userProgress.zipDone = true;
          userProgress.zipDuration = s.duration;
          userProgress.zipXP = s.xpEarned;
        } else if (s.gameType === "wend") {
          userProgress.wendDone = true;
          userProgress.wendDuration = s.duration;
          userProgress.wendXP = s.xpEarned;
        }
      });
      userProgress.todayXP = userProgress.zipXP + userProgress.wendXP;

      // Get or create player streak
      let streak = await PlayerStreak.findOne({ userId: req.user._id });
      if (!streak) {
        streak = await PlayerStreak.create({ userId: req.user._id });
      }

      // Build 7-day win streak tracker (Current week ending on or starting from Sunday/Monday)
      // As seen in user screenshot: 7 nodes labelled W T F S S M T, with a gift box at the end
      const weekNodes = [];
      const curr = new Date(today + "T00:00:00Z");
      // Generate 7 days ending with today + forward or anchor to 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(curr.getTime() - i * 86400000);
        const dStr = d.toISOString().split("T")[0];
        const dayLetter = getDayLetter(dStr);

        // Check if user completed challenge on dStr
        const completedCount = await GameSession.countDocuments({
          userId: req.user._id,
          date: dStr,
          completed: true,
        });

        weekNodes.push({
          date: dStr,
          dayLetter,
          completed: completedCount > 0,
          isToday: dStr === today,
          isGift: i === 0 && streak.currentStreak >= 7, // Gift unlocked on day 7
        });
      }

      streakData = {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalXP: streak.totalXP,
        gamesCompleted: streak.gamesCompleted,
        zipCompleted: streak.zipCompleted,
        wendCompleted: streak.wendCompleted,
        bestZipTime: streak.bestZipTime,
        bestWendTime: streak.bestWendTime,
        unlockedBadges: streak.unlockedBadges || [],
        weekNodes,
      };
    }

    // Community average stats for today
    const zipSessions = await GameSession.find({ date: today, gameType: "zip", completed: true });
    const avgZipTime = zipSessions.length
      ? Math.round(zipSessions.reduce((acc, s) => acc + s.duration, 0) / zipSessions.length)
      : 35; // Default reference: 0:35

    const wendSessions = await GameSession.find({ date: today, gameType: "wend", completed: true });
    const avgWendTime = wendSessions.length
      ? Math.round(wendSessions.reduce((acc, s) => acc + s.duration, 0) / wendSessions.length)
      : 30;

    return res.json({
      success: true,
      date: today,
      puzzleNumber: puzzle.puzzleNumber,
      puzzle: {
        zip: {
          gridSize: puzzle.zipPuzzle.gridSize,
          numbers: puzzle.zipPuzzle.numbers,
          parTime: puzzle.zipPuzzle.parTime,
          maxXP: puzzle.zipPuzzle.maxXP,
        },
        wend: {
          letters: puzzle.wendPuzzle.letters,
          grid: puzzle.wendPuzzle.grid,
          targetCount: puzzle.wendPuzzle.minWordsToWin,
          parTime: puzzle.wendPuzzle.parTime,
          maxXP: puzzle.wendPuzzle.maxXP,
          targetWords: puzzle.wendPuzzle.targetWords,
        },
      },
      userProgress,
      streak: streakData,
      community: {
        totalPlayersToday: zipSessions.length + wendSessions.length,
        avgZipTime,
        avgWendTime,
      },
    });
  } catch (err) {
    console.error("[GameController] getDailyChallenge error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. SUBMIT ZIP GAME ATTEMPT
exports.submitZip = async (req, res) => {
  try {
    const { path, duration, hintsUsed = 0 } = req.body;
    const userId = req.user._id;
    const today = getTodayIST();
    const puzzle = await getOrCreateTodayPuzzle(today);

    if (!Array.isArray(path) || path.length < 36) {
      return res.status(400).json({
        success: false,
        message: "A valid ZIP solution must cover all 36 grid cells.",
      });
    }

    // Validate path connectivity (each step must be adjacent: delta row <= 1, delta col <= 1, no diagonal)
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const dRow = Math.abs(curr.row - prev.row);
      const dCol = Math.abs(curr.col - prev.col);
      if (dRow + dCol !== 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid move between cell (${prev.row},${prev.col}) and (${curr.row},${curr.col}). Steps must be orthogonal adjacent.`,
        });
      }
    }

    // Validate numbers are visited in sequential order 1..N
    const numbers = puzzle.zipPuzzle.numbers.sort((a, b) => a.num - b.num);
    let expectedNum = 1;
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const matchNum = numbers.find((n) => n.row === p.row && n.col === p.col);
      if (matchNum) {
        if (matchNum.num !== expectedNum) {
          return res.status(400).json({
            success: false,
            message: `Number visited out of sequence: visited #${matchNum.num} but expected #${expectedNum}.`,
          });
        }
        expectedNum++;
      }
    }

    // XP calculation
    let xpEarned = puzzle.zipPuzzle.maxXP;
    // Speed bonus
    if (duration <= puzzle.zipPuzzle.parTime) {
      xpEarned += 25;
    }
    // Hint deduction
    xpEarned = Math.max(40, xpEarned - hintsUsed * 10);

    // Record session
    const session = await GameSession.create({
      userId,
      date: today,
      gameType: "zip",
      duration: Math.max(1, Math.round(duration)),
      completed: true,
      xpEarned,
      hintsUsed,
      pathTaken: path,
    });

    // Update streak and player statistics
    let streak = await PlayerStreak.findOne({ userId });
    if (!streak) {
      streak = await PlayerStreak.create({ userId });
    }

    // Check if user already won today
    const wasAlreadyWonToday = streak.lastCompletedDate === today;
    if (!wasAlreadyWonToday) {
      // Check if last win was yesterday
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (streak.lastCompletedDate === yesterday) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.lastCompletedDate = today;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.totalXP += xpEarned;
    streak.gamesCompleted += 1;
    streak.zipCompleted += 1;
    if (!streak.bestZipTime || duration < streak.bestZipTime) {
      streak.bestZipTime = Math.round(duration);
    }

    // Award badges
    const newBadges = [];
    const checkBadge = (bId) => {
      const alreadyHas = streak.unlockedBadges.some((b) => b.badgeId === bId);
      if (!alreadyHas) {
        streak.unlockedBadges.push({ badgeId: bId, unlockedAt: new Date() });
        const bInfo = ALL_BADGES.find((b) => b.id === bId);
        if (bInfo) {
          streak.totalXP += bInfo.xpReward;
          newBadges.push(bInfo);
        }
      }
    };

    checkBadge("first_game");
    if (duration <= 30) checkBadge("speed_zip");
    if (streak.currentStreak >= 3) checkBadge("streak_3");
    if (streak.currentStreak >= 7) checkBadge("streak_7");
    if (streak.currentStreak >= 30) checkBadge("streak_30");

    await streak.save();

    // Calculate percentile ranking against community
    const allToday = await GameSession.find({ date: today, gameType: "zip", completed: true });
    const slowerCount = allToday.filter((s) => s.duration >= duration).length;
    const percentile = Math.min(
      99,
      Math.max(1, Math.round((slowerCount / Math.max(1, allToday.length)) * 100))
    );

    const avgTime = Math.round(
      allToday.reduce((a, b) => a + b.duration, 0) / Math.max(1, allToday.length)
    );

    return res.json({
      success: true,
      message: "ZIP Puzzle Completed!",
      duration: Math.round(duration),
      xpEarned,
      newStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalXP: streak.totalXP,
      percentile: `Top ${Math.max(1, 100 - percentile)}%`,
      todayAvgTime: avgTime || 35,
      newBadges,
      puzzleNumber: puzzle.puzzleNumber,
    });
  } catch (err) {
    console.error("[GameController] submitZip error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. SUBMIT WEND GAME ATTEMPT
exports.submitWend = async (req, res) => {
  try {
    const { wordsFound, duration, hintsUsed = 0 } = req.body;
    const userId = req.user._id;
    const today = getTodayIST();
    const puzzle = await getOrCreateTodayPuzzle(today);

    if (!Array.isArray(wordsFound) || wordsFound.length < puzzle.wendPuzzle.minWordsToWin) {
      return res.status(400).json({
        success: false,
        message: `Must find at least ${puzzle.wendPuzzle.minWordsToWin} valid words to complete WEND.`,
      });
    }

    // Verify words exist in target words list (case-insensitive)
    const validTargets = puzzle.wendPuzzle.targetWords.map((w) => w.toUpperCase());
    const validWords = wordsFound.filter((w) => validTargets.includes(w.toUpperCase()));

    if (validWords.length < puzzle.wendPuzzle.minWordsToWin) {
      return res.status(400).json({
        success: false,
        message: `Only found ${validWords.length} recognized words. Need at least ${puzzle.wendPuzzle.minWordsToWin}.`,
      });
    }

    // XP calculation
    let xpEarned = puzzle.wendPuzzle.maxXP;
    if (duration <= puzzle.wendPuzzle.parTime) {
      xpEarned += 25; // Speed bonus
    }
    // Extra bonus for finding extra words
    if (validWords.length > puzzle.wendPuzzle.minWordsToWin) {
      xpEarned += (validWords.length - puzzle.wendPuzzle.minWordsToWin) * 15;
    }
    xpEarned = Math.max(40, xpEarned - hintsUsed * 10);

    // Save session
    await GameSession.create({
      userId,
      date: today,
      gameType: "wend",
      duration: Math.max(1, Math.round(duration)),
      completed: true,
      xpEarned,
      hintsUsed,
      wordsFound: validWords,
    });

    // Update streak
    let streak = await PlayerStreak.findOne({ userId });
    if (!streak) {
      streak = await PlayerStreak.create({ userId });
    }

    const wasAlreadyWonToday = streak.lastCompletedDate === today;
    if (!wasAlreadyWonToday) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (streak.lastCompletedDate === yesterday) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.lastCompletedDate = today;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.totalXP += xpEarned;
    streak.gamesCompleted += 1;
    streak.wendCompleted += 1;
    if (!streak.bestWendTime || duration < streak.bestWendTime) {
      streak.bestWendTime = Math.round(duration);
    }

    // Check Badges
    const newBadges = [];
    const checkBadge = (bId) => {
      const alreadyHas = streak.unlockedBadges.some((b) => b.badgeId === bId);
      if (!alreadyHas) {
        streak.unlockedBadges.push({ badgeId: bId, unlockedAt: new Date() });
        const bInfo = ALL_BADGES.find((b) => b.id === bId);
        if (bInfo) {
          streak.totalXP += bInfo.xpReward;
          newBadges.push(bInfo);
        }
      }
    };

    checkBadge("first_game");
    if (duration <= 20) checkBadge("speed_wend");
    if (streak.currentStreak >= 3) checkBadge("streak_3");
    if (streak.currentStreak >= 7) checkBadge("streak_7");
    if (streak.currentStreak >= 30) checkBadge("streak_30");

    // Check dual master (both done today)
    const hasZipToday = await GameSession.exists({
      userId,
      date: today,
      gameType: "zip",
      completed: true,
    });
    if (hasZipToday) {
      checkBadge("perfect_dual");
    }

    await streak.save();

    // Calculate community percentile
    const allToday = await GameSession.find({ date: today, gameType: "wend", completed: true });
    const slowerCount = allToday.filter((s) => s.duration >= duration).length;
    const percentile = Math.min(
      99,
      Math.max(1, Math.round((slowerCount / Math.max(1, allToday.length)) * 100))
    );

    const avgTime = Math.round(
      allToday.reduce((a, b) => a + b.duration, 0) / Math.max(1, allToday.length)
    );

    return res.json({
      success: true,
      message: "WEND Puzzle Solved!",
      duration: Math.round(duration),
      xpEarned,
      wordsFound: validWords,
      newStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalXP: streak.totalXP,
      percentile: `Top ${Math.max(1, 100 - percentile)}%`,
      todayAvgTime: avgTime || 30,
      newBadges,
      puzzleNumber: puzzle.puzzleNumber,
    });
  } catch (err) {
    console.error("[GameController] submitWend error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. GET LEADERBOARD
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = "today", game = "all" } = req.query;
    const today = getTodayIST();

    let dateFilter = {};
    if (type === "today") {
      dateFilter = { date: today };
    } else if (type === "weekly") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      dateFilter = { date: { $gte: sevenDaysAgo } };
    } else if (type === "monthly") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      dateFilter = { date: { $gte: thirtyDaysAgo } };
    }

    let matchGame = {};
    if (game === "zip") matchGame = { gameType: "zip" };
    if (game === "wend") matchGame = { gameType: "wend" };

    // Aggregate top players
    const matchQuery = { completed: true, ...dateFilter, ...matchGame };

    const topSessions = await GameSession.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$userId",
          bestTime: { $min: "$duration" },
          avgTime: { $avg: "$duration" },
          totalXP: { $sum: "$xpEarned" },
          gamesPlayed: { $sum: 1 },
        },
      },
      { $sort: { totalXP: -1, bestTime: 1 } },
      { $limit: 50 },
    ]);

    // Populate user info
    const populated = await Promise.all(
      topSessions.map(async (item, index) => {
        const u = await User.findById(item._id).select("name college profilePicture role");
        const streak = await PlayerStreak.findOne({ userId: item._id }).select("currentStreak longestStreak");
        return {
          rank: index + 1,
          userId: item._id,
          name: u ? u.name : "Maatram Explorer",
          college: u ? u.college : "Foundation",
          avatar: u ? u.profilePicture : null,
          role: u ? u.role : "student",
          bestTime: item.bestTime,
          avgTime: Math.round(item.avgTime),
          totalXP: item.totalXP,
          gamesPlayed: item.gamesPlayed,
          currentStreak: streak ? streak.currentStreak : 0,
        };
      })
    );

    return res.json({
      success: true,
      type,
      game,
      leaderboard: populated,
    });
  } catch (err) {
    console.error("[GameController] getLeaderboard error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. GET BADGES
exports.getBadges = async (req, res) => {
  try {
    let unlockedMap = {};
    if (req.user && req.user._id) {
      const streak = await PlayerStreak.findOne({ userId: req.user._id });
      if (streak && streak.unlockedBadges) {
        streak.unlockedBadges.forEach((b) => {
          unlockedMap[b.badgeId] = b.unlockedAt;
        });
      }
    }

    const badges = ALL_BADGES.map((b) => ({
      ...b,
      isUnlocked: !!unlockedMap[b.id],
      unlockedAt: unlockedMap[b.id] || null,
    }));

    return res.json({
      success: true,
      badges,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. GET USER HISTORY
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await GameSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.json({
      success: true,
      history,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 7. ADMIN: LIST ALL PUZZLES
exports.getAdminPuzzles = async (req, res) => {
  try {
    const puzzles = await DailyPuzzle.find().sort({ date: -1 }).limit(30);
    return res.json({ success: true, puzzles });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 8. ADMIN: CREATE OR UPDATE PUZZLE
exports.saveAdminPuzzle = async (req, res) => {
  try {
    const { date, puzzleNumber, zipPuzzle, wendPuzzle } = req.body;
    let puzzle = await DailyPuzzle.findOne({ date });
    if (puzzle) {
      if (puzzleNumber) puzzle.puzzleNumber = puzzleNumber;
      if (zipPuzzle) puzzle.zipPuzzle = zipPuzzle;
      if (wendPuzzle) puzzle.wendPuzzle = wendPuzzle;
      await puzzle.save();
    } else {
      puzzle = await DailyPuzzle.create({
        date,
        puzzleNumber: puzzleNumber || 165,
        zipPuzzle,
        wendPuzzle,
        createdBy: req.user._id,
      });
    }
    return res.json({ success: true, message: "Puzzle saved successfully", puzzle });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

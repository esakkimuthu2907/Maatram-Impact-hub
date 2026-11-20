// backend/models/Game.js
const mongoose = require("mongoose");

// Daily puzzle common across all users
const DailyPuzzleSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD (IST)
      required: true,
      unique: true,
      index: true,
    },
    puzzleNumber: {
      type: Number,
      required: true,
    },
    // ZIP Game Puzzle
    zipPuzzle: {
      gridSize: { type: Number, default: 6 },
      numbers: [
        {
          num: { type: Number, required: true },
          row: { type: Number, required: true }, // 0 to gridSize - 1
          col: { type: Number, required: true }, // 0 to gridSize - 1
        },
      ],
      // Valid full paths or acceptable solution coordinates (all 36 cells)
      solution: [
        {
          row: { type: Number },
          col: { type: Number },
        },
      ],
      parTime: { type: Number, default: 45 }, // seconds
      maxXP: { type: Number, default: 100 },
    },
    // WEND Game Puzzle
    wendPuzzle: {
      letters: {
        type: [String],
        default: ["W", "E", "D", "N"],
      },
      grid: {
        type: [[String]],
        default: [
          ["W", "E"],
          ["D", "N"],
        ],
      },
      targetWords: {
        type: [String],
        default: ["WEND", "NEWS", "DENS", "WEDS", "NEW", "DEW", "END", "WED"],
      },
      minWordsToWin: { type: Number, default: 4 },
      parTime: { type: Number, default: 35 },
      maxXP: { type: Number, default: 100 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Individual attempt/session
const GameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    gameType: {
      type: String,
      enum: ["zip", "wend"],
      required: true,
    },
    duration: {
      type: Number, // seconds taken
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
    wordsFound: {
      type: [String],
      default: [],
    },
    pathTaken: [
      {
        row: Number,
        col: Number,
      },
    ],
  },
  { timestamps: true }
);

// User game streak & profile
const PlayerStreakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: String,
      default: null,
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    gamesCompleted: {
      type: Number,
      default: 0,
    },
    zipCompleted: {
      type: Number,
      default: 0,
    },
    wendCompleted: {
      type: Number,
      default: 0,
    },
    bestZipTime: {
      type: Number,
      default: null, // in seconds
    },
    bestWendTime: {
      type: Number,
      default: null, // in seconds
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    // Array of unlocked badge IDs
    unlockedBadges: [
      {
        badgeId: String,
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  DailyPuzzle: mongoose.model("DailyPuzzle", DailyPuzzleSchema),
  GameSession: mongoose.model("GameSession", GameSessionSchema),
  PlayerStreak: mongoose.model("PlayerStreak", PlayerStreakSchema),
};

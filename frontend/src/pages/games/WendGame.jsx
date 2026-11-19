// frontend/src/pages/games/WendGame.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  Clock,
  Shuffle,
  Send,
  Copy,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
} from "lucide-react";
import { gamesAPI } from "../../api/gamesAPI";
import "./WendGame.css";
import "./ZipGame.css"; // Reuse shared celebration modal styles

export default function WendGame() {
  const navigate = useNavigate();

  // Puzzle configuration
  const [puzzleNumber, setPuzzleNumber] = useState(163);
  const [grid, setGrid] = useState([
    ["W", "E"],
    ["D", "N"],
  ]);
  const [targetWords, setTargetWords] = useState([
    "WEND",
    "NEWS",
    "DENS",
    "WEDS",
    "NEW",
    "DEW",
    "END",
    "WED",
  ]);
  const [minWordsToWin, setMinWordsToWin] = useState(4);

  // Play state
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [foundWords, setFoundWords] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isError, setIsError] = useState(false);

  // Celebration modal state
  const [completedResult, setCompletedResult] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(1);
  const [copiedText, setCopiedText] = useState(false);

  const timerRef = useRef(null);

  // Load today's challenge
  useEffect(() => {
    async function loadPuzzle() {
      try {
        const res = await gamesAPI.getDailyChallenge();
        const data = res.data || res;
        if (data && data.puzzle && data.puzzle.wend) {
          setPuzzleNumber(data.puzzleNumber || 163);
          const wend = data.puzzle.wend;
          if (wend.grid) setGrid(wend.grid);
          if (wend.targetWords) setTargetWords(wend.targetWords);
          if (wend.targetCount) setMinWordsToWin(wend.targetCount);
        }
      } catch (err) {
        console.warn("Using default WEND puzzle:", err);
      }
    }
    loadPuzzle();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Flattened letters array with row/col
  const flatTiles = [
    { letter: grid[0][0], r: 0, c: 0, index: 0 },
    { letter: grid[0][1], r: 0, c: 1, index: 1 },
    { letter: grid[1][0], r: 1, c: 0, index: 2 },
    { letter: grid[1][1], r: 1, c: 1, index: 3 },
  ];

  // Tile click handler
  const handleTileClick = (index) => {
    if (completedResult) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    // Toggle: if clicking the last tile, remove it (backspace)
    if (selectedIndices.length > 0 && selectedIndices[selectedIndices.length - 1] === index) {
      const next = selectedIndices.slice(0, -1);
      setSelectedIndices(next);
      setCurrentWord(next.map((i) => flatTiles[i].letter).join(""));
      return;
    }

    // Add letter
    const next = [...selectedIndices, index];
    setSelectedIndices(next);
    setCurrentWord(next.map((i) => flatTiles[i].letter).join(""));
  };

  // Submit formed word
  const handleSubmitWord = () => {
    if (!currentWord || currentWord.length < 2) return;

    const upper = currentWord.toUpperCase();

    if (foundWords.includes(upper)) {
      setFeedbackMsg(`Already found "${upper}"!`);
      setIsError(true);
      setTimeout(() => setFeedbackMsg(null), 1500);
      handleClearWord();
      return;
    }

    const isMatch = targetWords.some((w) => w.toUpperCase() === upper);
    if (!isMatch) {
      setFeedbackMsg(`"${upper}" is not in today's word list`);
      setIsError(true);
      setTimeout(() => setFeedbackMsg(null), 1500);
      handleClearWord();
      return;
    }

    // Valid word found!
    const newFound = [...foundWords, upper];
    setFoundWords(newFound);
    setFeedbackMsg(`+ Valid Word: ${upper}!`);
    setIsError(false);
    setTimeout(() => setFeedbackMsg(null), 1500);
    handleClearWord();

    // Check win condition
    if (newFound.length >= minWordsToWin) {
      handleGameWin(newFound);
    }
  };

  const handleClearWord = () => {
    setSelectedIndices([]);
    setCurrentWord("");
  };

  const handleHint = () => {
    setHintsUsed((h) => h + 1);
    // Find first target word not yet found
    const missing = targetWords.find((w) => !foundWords.includes(w.toUpperCase()));
    if (missing) {
      setFeedbackMsg(`Hint: Starts with "${missing.slice(0, 2).toUpperCase()}"...`);
      setIsError(false);
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleGameWin = async (finalWords) => {
    setIsTimerRunning(false);
    const finalDuration = Math.max(1, seconds);

    try {
      const res = await gamesAPI.submitWend({
        wordsFound: finalWords,
        duration: finalDuration,
        hintsUsed,
      });
      const data = res.data || res;
      setCompletedResult({
        duration: finalDuration,
        todayAvg: data.todayAvgTime || 30,
        newStreak: data.newStreak || 1,
        percentile: data.percentile || "Top 25%",
        xpEarned: data.xpEarned || 100,
        puzzleNumber: data.puzzleNumber || puzzleNumber,
      });
    } catch (err) {
      setCompletedResult({
        duration: finalDuration,
        todayAvg: 30,
        newStreak: 1,
        percentile: "Top 25%",
        xpEarned: 100,
        puzzleNumber,
      });
    }
  };

  const handleCopyResult = () => {
    const timeStr = formatTime(completedResult?.duration || seconds);
    const shareText = `Maatram Wend #${puzzleNumber} ⏱️ ${timeStr}\n🔥 Streak: ${
      completedResult?.newStreak || 1
    } days\n🔤 Words: ${foundWords.length}/${minWordsToWin}\n⚡ XP: +${
      completedResult?.xpEarned || 100
    }\nPlay at: https://maatram.org/games/wend`;

    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="wend-game-page">
      {/* ─── Header & Timer ─── */}
      <div className="wend-header-nav">
        <Link to="/games" className="wend-back-link">
          <ArrowLeft size={18} />
          <span>Games Hub</span>
        </Link>

        <div className="wend-timer-pill">
          <Clock size={16} color="#F59E0B" />
          <span>{formatTime(seconds)}</span>
        </div>
      </div>

      <div className="wend-title-section">
        {/* Exact Logo from Screenshot 3 */}
        <div className="wend-logo-grid">
          <div className="wend-logo-tile">W</div>
          <div className="wend-logo-tile">E</div>
          <div className="wend-logo-tile">D</div>
          <div className="wend-logo-tile">N</div>
        </div>
        <h2>Wend #{puzzleNumber}</h2>
        <p>
          Form words using the 4 letters • Find at least {minWordsToWin} words to win!
        </p>
      </div>

      {/* Word In-Progress Box */}
      <div className="wend-word-preview-box">
        {currentWord ? (
          <span className="wend-active-word">{currentWord}</span>
        ) : (
          <span className="wend-word-placeholder">
            {feedbackMsg ? (
              <span style={{ color: isError ? "#EF4444" : "#15803D" }}>{feedbackMsg}</span>
            ) : (
              "Tap letters below to form a word"
            )}
          </span>
        )}
      </div>

      {/* 2x2 Interactive Letter Grid */}
      <div className="wend-grid-wrapper">
        <div className="wend-letter-grid">
          {flatTiles.map((tile) => {
            const isSelected = selectedIndices.includes(tile.index);
            return (
              <div
                key={tile.index}
                className={`wend-letter-tile ${isSelected ? "selected" : ""}`}
                onClick={() => handleTileClick(tile.index)}
              >
                {tile.letter}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="wend-actions-row">
        <button
          className="wend-action-btn"
          onClick={handleClearWord}
          disabled={!currentWord}
        >
          <RotateCcw size={16} />
          <span>Clear</span>
        </button>

        <button className="wend-action-btn" onClick={handleHint}>
          <Lightbulb size={16} />
          <span>Hint</span>
        </button>

        <button
          className="wend-action-btn wend-submit-btn"
          onClick={handleSubmitWord}
          disabled={!currentWord || currentWord.length < 2}
        >
          <Check size={18} strokeWidth={3} />
          <span>Submit Word</span>
        </button>
      </div>

      {/* Found Words List */}
      <div className="wend-found-card">
        <div className="wend-found-header">
          <h4>
            Found Words ({foundWords.length} / {minWordsToWin})
          </h4>
          <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 700 }}>
            {foundWords.length >= minWordsToWin ? "Goal Reached! 🎉" : "In Progress"}
          </span>
        </div>

        <div className="wend-chips-wrap">
          {foundWords.length === 0 ? (
            <span style={{ fontSize: 13, color: "#94A3B8" }}>No words submitted yet</span>
          ) : (
            foundWords.map((w, idx) => (
              <div key={idx} className="wend-word-chip">
                <span>{w}</span>
                <Check size={13} strokeWidth={3} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Golden Celebration Modal (Matches Screenshot 3) ─── */}
      {completedResult && (
        <div className="celebration-modal-overlay">
          <div className="celebration-modal-card">
            {/* Top Logo / Identifier */}
            <div className="celebration-header-icon">🔤</div>
            <div className="celebration-puzzle-subtitle">
              Wend #{completedResult.puzzleNumber}
            </div>
            <h1 className="celebration-headline">You're crushing it!</h1>

            {/* Carousel with Left/Right Arrows */}
            <div className="celebration-carousel-container">
              <button
                className="carousel-arrow-btn"
                onClick={() =>
                  setCarouselIndex((idx) => (idx === 0 ? 2 : idx - 1))
                }
              >
                <ChevronLeft size={20} />
              </button>

              {/* Slide 0: Streak */}
              {carouselIndex === 0 && (
                <div className="carousel-main-card">
                  <div
                    className="carousel-clock-icon"
                    style={{ borderColor: "#F59E0B", color: "#F59E0B" }}
                  >
                    <Flame size={32} />
                  </div>
                  <div className="carousel-time-text">
                    {completedResult.newStreak} Days
                  </div>
                  <p className="carousel-avg-text">New streak! Game on!</p>
                </div>
              )}

              {/* Slide 1: Completion Time */}
              {carouselIndex === 1 && (
                <div className="carousel-main-card">
                  <div className="carousel-clock-icon">
                    <Clock size={32} />
                  </div>
                  <div className="carousel-time-text">
                    {formatTime(completedResult.duration)}
                  </div>
                  <p className="carousel-avg-text">
                    Today's avg: {formatTime(completedResult.todayAvg)}
                  </p>
                </div>
              )}

              {/* Slide 2: Ranking */}
              {carouselIndex === 2 && (
                <div className="carousel-main-card">
                  <div
                    className="carousel-clock-icon"
                    style={{ borderColor: "#10B981", color: "#10B981" }}
                  >
                    <Trophy size={32} />
                  </div>
                  <div className="carousel-time-text">
                    {completedResult.percentile}
                  </div>
                  <p className="carousel-avg-text">Of all Maatram players</p>
                </div>
              )}

              <button
                className="carousel-arrow-btn"
                onClick={() =>
                  setCarouselIndex((idx) => (idx === 2 ? 0 : idx + 1))
                }
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Share action buttons (Post, Send, Copy) */}
            <div className="celebration-share-actions">
              <div className="share-action-item">
                <button
                  className="share-circle-btn"
                  onClick={() => navigate("/connect")}
                  title="Post to Feed"
                >
                  <Edit3 size={20} />
                </button>
                <span>Post</span>
              </div>

              <div className="share-action-item">
                <button
                  className="share-circle-btn"
                  onClick={() => navigate("/messages")}
                  title="Send via Message"
                >
                  <Send size={20} />
                </button>
                <span>Send</span>
              </div>

              <div className="share-action-item">
                <button
                  className="share-circle-btn"
                  onClick={handleCopyResult}
                  title="Copy Score"
                >
                  {copiedText ? <Check size={20} color="#10B981" /> : <Copy size={20} />}
                </button>
                <span>{copiedText ? "Copied!" : "Copy"}</span>
              </div>
            </div>

            <button
              className="celebration-next-btn"
              onClick={() => navigate("/games/leaderboard")}
            >
              View Global Leaderboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

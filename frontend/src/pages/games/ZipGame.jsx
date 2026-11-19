// frontend/src/pages/games/ZipGame.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
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
import "./ZipGame.css";

export default function ZipGame() {
  const navigate = useNavigate();

  // Puzzle configuration (matches reference screenshot 2)
  const [puzzleNumber, setPuzzleNumber] = useState(163);
  const [gridSize, setGridSize] = useState(6);
  const [targetNumbers, setTargetNumbers] = useState([
    { num: 1, row: 3, col: 3 },
    { num: 2, row: 4, col: 4 },
    { num: 3, row: 1, col: 4 },
    { num: 4, row: 3, col: 2 },
    { num: 5, row: 4, col: 1 },
    { num: 6, row: 2, col: 2 },
    { num: 7, row: 1, col: 1 },
    { num: 8, row: 2, col: 3 },
  ]);

  // Game state
  const [path, setPath] = useState([{ row: 3, col: 3 }]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(true);
  const [completedResult, setCompletedResult] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(1); // 0 = streak, 1 = time, 2 = percentile
  const [copiedText, setCopiedText] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const timerRef = useRef(null);

  // Fetch today's official challenge
  useEffect(() => {
    async function loadPuzzle() {
      try {
        const res = await gamesAPI.getDailyChallenge();
        const data = res.data || res;
        if (data && data.puzzle && data.puzzle.zip) {
          setPuzzleNumber(data.puzzleNumber || 163);
          const zip = data.puzzle.zip;
          if (zip.numbers && zip.numbers.length > 0) {
            setTargetNumbers(zip.numbers);
            const startDot = zip.numbers.find((n) => n.num === 1) || zip.numbers[0];
            setPath([{ row: startDot.row, col: startDot.col }]);
          }
        }
      } catch (err) {
        console.warn("Using default ZIP puzzle:", err);
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

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Helper to find number at cell
  const getNumberAt = (r, c) => {
    return targetNumbers.find((n) => n.row === r && n.col === c);
  };

  // Check if cell is in visited path
  const isCellVisited = (r, c) => {
    return path.some((p) => p.row === r && p.col === c);
  };

  // Cell interaction handler
  const handleCellInteraction = (r, c) => {
    if (completedResult) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const currentHead = path[path.length - 1];
    if (currentHead.row === r && currentHead.col === c) return;

    // Check adjacency (orthogonal only: up/down/left/right)
    const dRow = Math.abs(currentHead.row - r);
    const dCol = Math.abs(currentHead.col - c);
    if (dRow + dCol !== 1) {
      return; // Not adjacent
    }

    // Check if cell is already in path
    const existingIndex = path.findIndex((p) => p.row === r && p.col === c);
    if (existingIndex !== -1) {
      // If clicking the previous cell, treat as quick undo
      if (existingIndex === path.length - 2) {
        setPath(path.slice(0, -1));
        setErrorMsg(null);
      }
      return;
    }

    // Check sequential number validation
    const targetAtCell = getNumberAt(r, c);
    if (targetAtCell) {
      // Find what number we should visit next
      const visitedTargetNums = path
        .map((p) => getNumberAt(p.row, p.col))
        .filter(Boolean)
        .map((n) => n.num);
      const nextExpectedNum = visitedTargetNums.length + 1;

      if (targetAtCell.num !== nextExpectedNum) {
        setErrorMsg(`Must visit number ${nextExpectedNum} first!`);
        setTimeout(() => setErrorMsg(null), 1500);
        return;
      }
    }

    const newPath = [...path, { row: r, col: c }];
    setPath(newPath);
    setErrorMsg(null);

    // Check for win condition: all 36 cells visited and visited all 8 numbers
    if (newPath.length === gridSize * gridSize) {
      const visitedTargetNums = newPath
        .map((p) => getNumberAt(p.row, p.col))
        .filter(Boolean)
        .map((n) => n.num);

      if (visitedTargetNums.length === targetNumbers.length) {
        handleGameWin(newPath);
      }
    }
  };

  // Undo last step
  const handleUndo = () => {
    if (path.length > 1) {
      setPath(path.slice(0, -1));
    }
  };

  // Restart puzzle
  const handleRestart = () => {
    const startDot = targetNumbers.find((n) => n.num === 1) || { row: 3, col: 3 };
    setPath([{ row: startDot.row, col: startDot.col }]);
    setSeconds(0);
    setIsTimerRunning(false);
    setErrorMsg(null);
  };

  // Hint logic: highlights or auto-extends one step
  const handleHint = () => {
    setHintsUsed((h) => h + 1);
    const currentHead = path[path.length - 1];
    // Find an empty unvisited adjacent cell
    const neighbors = [
      { row: currentHead.row - 1, col: currentHead.col },
      { row: currentHead.row + 1, col: currentHead.col },
      { row: currentHead.row, col: currentHead.col - 1 },
      { row: currentHead.row, col: currentHead.col + 1 },
    ].filter(
      (n) =>
        n.row >= 0 &&
        n.row < gridSize &&
        n.col >= 0 &&
        n.col < gridSize &&
        !isCellVisited(n.row, n.col)
    );

    if (neighbors.length > 0) {
      handleCellInteraction(neighbors[0].row, neighbors[0].col);
    }
  };

  // Game Won
  const handleGameWin = async (finalPath) => {
    setIsTimerRunning(false);
    const finalDuration = Math.max(1, seconds);

    try {
      const res = await gamesAPI.submitZip({
        path: finalPath,
        duration: finalDuration,
        hintsUsed,
      });
      const data = res.data || res;
      setCompletedResult({
        duration: finalDuration,
        todayAvg: data.todayAvgTime || 35,
        newStreak: data.newStreak || 1,
        percentile: data.percentile || "Top 25%",
        xpEarned: data.xpEarned || 100,
        puzzleNumber: data.puzzleNumber || puzzleNumber,
      });
    } catch (err) {
      // Local graceful fallback
      setCompletedResult({
        duration: finalDuration,
        todayAvg: 35,
        newStreak: 1,
        percentile: "Top 25%",
        xpEarned: 100,
        puzzleNumber,
      });
    }
  };

  // Copy result text (LinkedIn Games style)
  const handleCopyResult = () => {
    const timeStr = formatTime(completedResult?.duration || seconds);
    const shareText = `Maatram Zip #${puzzleNumber} ⏱️ ${timeStr}\n🔥 Streak: ${
      completedResult?.newStreak || 1
    } days\n⚡ XP: +${completedResult?.xpEarned || 100}\nPlay at: https://maatram.org/games/zip`;

    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="zip-game-page">
      {/* ─── Header & Timer ─── */}
      <div className="zip-header-nav">
        <Link to="/games" className="zip-back-link">
          <ArrowLeft size={18} />
          <span>Games Hub</span>
        </Link>

        <div className="zip-timer-pill">
          <Clock size={16} color="#0284C7" />
          <span>{formatTime(seconds)}</span>
        </div>
      </div>

      <div className="zip-puzzle-title-bar">
        <h2>Zip #{puzzleNumber}</h2>
        <p>
          Visited {path.length} / {gridSize * gridSize} cells
        </p>
        {errorMsg && (
          <div
            style={{
              color: "#EF4444",
              fontWeight: 700,
              fontSize: 13,
              marginTop: 4,
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* ─── 6x6 Grid (Matches Screenshot 2) ─── */}
      <div
        className="zip-board-wrapper"
        onMouseLeave={() => setIsDrawing(false)}
        onMouseUp={() => setIsDrawing(false)}
      >
        <div className="zip-grid">
          {Array.from({ length: gridSize }).map((_, r) =>
            Array.from({ length: gridSize }).map((_, c) => {
              const numObj = getNumberAt(r, c);
              const visited = isCellVisited(r, c);
              const isHead =
                path.length > 0 &&
                path[path.length - 1].row === r &&
                path[path.length - 1].col === c;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`zip-cell ${visited ? "visited" : ""} ${
                    isHead ? "active-head" : ""
                  }`}
                  onMouseDown={() => {
                    setIsDrawing(true);
                    handleCellInteraction(r, c);
                  }}
                  onMouseEnter={() => {
                    if (isDrawing) {
                      handleCellInteraction(r, c);
                    }
                  }}
                  onTouchStart={() => handleCellInteraction(r, c)}
                >
                  {numObj ? (
                    <div
                      className={`zip-num-badge ${
                        numObj.num === 1 && path.length === 1 ? "active-start" : ""
                      } ${visited ? "passed" : ""}`}
                    >
                      {numObj.num}
                    </div>
                  ) : visited ? (
                    <div className="zip-path-dot" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Controls Row: Undo & Hint (Matches Screenshot 2) ─── */}
      <div className="zip-controls-row">
        <button
          className="zip-ctrl-btn"
          onClick={handleUndo}
          disabled={path.length <= 1}
        >
          <RotateCcw size={16} />
          <span>Undo</span>
        </button>

        <button className="zip-ctrl-btn" onClick={handleHint}>
          <Lightbulb size={16} />
          <span>Hint</span>
        </button>

        <button className="zip-ctrl-btn" onClick={handleRestart}>
          <span>Restart</span>
        </button>
      </div>

      {/* ─── "How to play" Section (Matches Screenshot 2) ─── */}
      <div className="zip-how-to-play-card">
        <div className="zip-how-header" onClick={() => setShowHowToPlay(!showHowToPlay)}>
          <span>How to play</span>
          {showHowToPlay ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {showHowToPlay && (
          <div className="zip-rules-content">
            <div className="rule-col">
              <div className="rule-icon-box">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "#000",
                    padding: "4px 8px",
                    borderRadius: 14,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  <span style={{ background: "#0284c7", borderRadius: "50%", padding: "2px 6px" }}>1</span>
                  <span style={{ background: "#0284c7", borderRadius: "50%", padding: "2px 6px" }}>2</span>
                  <span style={{ background: "#0284c7", borderRadius: "50%", padding: "2px 6px" }}>3</span>
                </div>
              </div>
              <span>Connect the dots in order</span>
            </div>

            <div className="rule-col">
              <div className="rule-icon-box">
                <div
                  style={{
                    width: 38,
                    height: 38,
                    border: "2.5px solid #0284c7",
                    borderRadius: 8,
                    background: "#e0f2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#0284c7",
                  }}
                >
                  36/36
                </div>
              </div>
              <span>Fill every cell</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Golden Celebration Modal (Matches Screenshot 3) ─── */}
      {completedResult && (
        <div className="celebration-modal-overlay">
          <div className="celebration-modal-card">
            {/* Top Logo / Identifier */}
            <div className="celebration-header-icon">🔢</div>
            <div className="celebration-puzzle-subtitle">
              Zip #{completedResult.puzzleNumber}
            </div>
            <h1 className="celebration-headline">You're crushing it!</h1>

            {/* Carousel with Left/Right Arrows (Screenshot 3 Inspiration) */}
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
                  <div className="carousel-clock-icon" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                    <Flame size={32} />
                  </div>
                  <div className="carousel-time-text">
                    {completedResult.newStreak} Days
                  </div>
                  <p className="carousel-avg-text">New streak! Game on!</p>
                </div>
              )}

              {/* Slide 1: Completion Time (Center in Screenshot 3) */}
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

              {/* Slide 2: Percentile & Ranking */}
              {carouselIndex === 2 && (
                <div className="carousel-main-card">
                  <div className="carousel-clock-icon" style={{ borderColor: "#10b981", color: "#10b981" }}>
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

            {/* Share action buttons (Post, Send, Copy from Screenshot 3) */}
            <div className="celebration-share-actions">
              <div className="share-action-item">
                <button
                  className="share-circle-btn"
                  onClick={() => navigate("/connect")}
                  title="Post to Community"
                >
                  <Edit3 size={20} />
                </button>
                <span>Post</span>
              </div>

              <div className="share-action-item">
                <button
                  className="share-circle-btn"
                  onClick={() => navigate("/messages")}
                  title="Send to Friends"
                >
                  <Send size={20} />
                </button>
                <span>Send</span>
              </div>

              <div className="share-action-item">
                <button
                  className="share-circle-btn"
                  onClick={handleCopyResult}
                  title="Copy Score Summary"
                >
                  {copiedText ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                </button>
                <span>{copiedText ? "Copied!" : "Copy"}</span>
              </div>
            </div>

            {/* Next Game button */}
            <button
              className="celebration-next-btn"
              onClick={() => navigate("/games/wend")}
            >
              Play Today's WEND Game →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

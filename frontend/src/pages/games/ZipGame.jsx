// frontend/src/pages/games/ZipGame.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  Clock,
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

  // Puzzle configuration
  const [puzzleNumber, setPuzzleNumber] = useState(163);
  const [gridSize] = useState(6);
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
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [completedResult, setCompletedResult] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(1); // 0 = streak, 1 = time, 2 = percentile
  const [copiedText, setCopiedText] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Refs keep the latest values for fast drag / touch events
  const pathRef = useRef(path);
  const secondsRef = useRef(0);
  const drawingRef = useRef(false);
  const submittedRef = useRef(false);
  const gridRef = useRef(null);
  const timerRef = useRef(null);

  const totalCells = gridSize * gridSize;

  const applyPath = (next) => {
    pathRef.current = next;
    setPath(next);
  };

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
            applyPath([{ row: startDot.row, col: startDot.col }]);
          }
        }
      } catch (err) {
        console.warn("Using default ZIP puzzle:", err);
      }
    }
    loadPuzzle();
  }, []);

  // Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getNumberAt = (r, c) =>
    targetNumbers.find((n) => n.row === r && n.col === c);

  const isCellVisited = (r, c) => path.some((p) => p.row === r && p.col === c);

  // ✅ A puzzle is solved ONLY when every cell is filled by one continuous
  // path and the numbers were visited in the right order (1, 2, 3 ...).
  const isSolved = (p) => {
    if (p.length !== totalCells) return false;

    const seen = new Set(p.map((cell) => `${cell.row}-${cell.col}`));
    if (seen.size !== p.length) return false;

    for (let i = 1; i < p.length; i++) {
      const step =
        Math.abs(p[i].row - p[i - 1].row) + Math.abs(p[i].col - p[i - 1].col);
      if (step !== 1) return false;
    }

    const order = p
      .map((cell) => getNumberAt(cell.row, cell.col))
      .filter(Boolean)
      .map((n) => n.num);

    if (order.length !== targetNumbers.length) return false;
    return order.every((num, i) => num === i + 1);
  };

  // Move into a cell (tap, drag or touch)
  const handleCell = (r, c) => {
    if (completedResult || submittedRef.current) return;

    const cur = pathRef.current;
    const head = cur[cur.length - 1];
    if (head.row === r && head.col === c) return;

    // Going back onto your own path = step back to that cell
    const existingIndex = cur.findIndex((p) => p.row === r && p.col === c);
    if (existingIndex !== -1) {
      applyPath(cur.slice(0, existingIndex + 1));
      setErrorMsg(null);
      return;
    }

    // Only up / down / left / right
    if (Math.abs(head.row - r) + Math.abs(head.col - c) !== 1) return;

    // Numbers must be visited in order
    const target = getNumberAt(r, c);
    if (target) {
      const visitedCount = cur.filter((p) => getNumberAt(p.row, p.col)).length;
      if (target.num !== visitedCount + 1) {
        setErrorMsg(`Visit number ${visitedCount + 1} first!`);
        setTimeout(() => setErrorMsg(null), 1500);
        return;
      }
    }

    if (!isTimerRunning) setIsTimerRunning(true);

    const next = [...cur, { row: r, col: c }];
    applyPath(next);
    setErrorMsg(null);

    // ✅ Submit only when the answer is correct. Otherwise nothing is sent.
    if (isSolved(next)) {
      handleGameWin(next);
    }
  };

  // Pointer (mouse + touch + pen) handling on the whole board
  const cellFromEvent = (e) => {
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    return {
      r: Math.floor((y / rect.height) * gridSize),
      c: Math.floor((x / rect.width) * gridSize),
    };
  };

  const onPointerDown = (e) => {
    drawingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const cell = cellFromEvent(e);
    if (cell) handleCell(cell.r, cell.c);
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const cell = cellFromEvent(e);
    if (cell) handleCell(cell.r, cell.c);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const handleUndo = () => {
    const cur = pathRef.current;
    if (cur.length > 1 && !completedResult) applyPath(cur.slice(0, -1));
  };

  const handleRestart = () => {
    if (completedResult) return;
    const startDot = targetNumbers.find((n) => n.num === 1) || { row: 3, col: 3 };
    applyPath([{ row: startDot.row, col: startDot.col }]);
    setSeconds(0);
    secondsRef.current = 0;
    setIsTimerRunning(false);
    setErrorMsg(null);
  };

  // Hint: one step towards the next number
  const handleHint = () => {
    if (completedResult) return;
    const cur = pathRef.current;
    const head = cur[cur.length - 1];
    const visitedCount = cur.filter((p) => getNumberAt(p.row, p.col)).length;
    const nextTarget = targetNumbers.find((n) => n.num === visitedCount + 1);

    const options = [
      { row: head.row - 1, col: head.col },
      { row: head.row + 1, col: head.col },
      { row: head.row, col: head.col - 1 },
      { row: head.row, col: head.col + 1 },
    ].filter((n) => {
      if (n.row < 0 || n.row >= gridSize || n.col < 0 || n.col >= gridSize) return false;
      if (cur.some((p) => p.row === n.row && p.col === n.col)) return false;
      const num = getNumberAt(n.row, n.col);
      return !num || num.num === visitedCount + 1;
    });

    if (options.length === 0) return;

    if (nextTarget) {
      options.sort(
        (a, b) =>
          Math.abs(a.row - nextTarget.row) +
          Math.abs(a.col - nextTarget.col) -
          (Math.abs(b.row - nextTarget.row) + Math.abs(b.col - nextTarget.col))
      );
    }

    setHintsUsed((h) => h + 1);
    handleCell(options[0].row, options[0].col);
  };

  // Called only for a correct, complete solution
  const handleGameWin = async (finalPath) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsTimerRunning(false);
    const finalDuration = Math.max(1, secondsRef.current);

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

  const handleCopyResult = () => {
    const timeStr = formatTime(completedResult?.duration || seconds);
    const shareText = `Maatram Zip #${puzzleNumber} ⏱️ ${timeStr}\n🔥 Streak: ${completedResult?.newStreak || 1
      } days\n⚡ XP: +${completedResult?.xpEarned || 100}\nPlay at: https://maatram.org/games/zip`;

    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const head = path[path.length - 1];
  const pathPoints = path.map((p) => `${p.col + 0.5},${p.row + 0.5}`).join(" ");

  return (
    <div className="zip-game-page">
      {/* ─── Header & Timer ─── */}
      <div className="zip-header-nav">
        <Link to="/games" className="zip-back-link">
          <ArrowLeft size={18} />
          <span>Games Hub</span>
        </Link>

        <div className="zip-puzzle-name">Zip #{puzzleNumber}</div>

        <div className="zip-timer-pill">
          <Clock size={15} color="#ea580c" />
          <span>{formatTime(seconds)}</span>
        </div>
      </div>

      {/* One short line with the rules + progress */}
      <p className="zip-status-line">
        {errorMsg ? (
          <span className="zip-error">{errorMsg}</span>
        ) : (
          <>
            Connect <b>1 → {targetNumbers.length}</b> in order &amp; fill every
            cell · <b>{path.length}/{totalCells}</b>
          </>
        )}
      </p>

      {/* ─── Board ─── */}
      <div className="zip-board-wrapper">
        <div
          className="zip-grid-wrap"
          ref={gridRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        >
          <div
            className="zip-grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {Array.from({ length: gridSize }).map((_, r) =>
              Array.from({ length: gridSize }).map((_, c) => {
                const numObj = getNumberAt(r, c);
                const visited = isCellVisited(r, c);
                const isHead = head.row === r && head.col === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`zip-cell ${visited ? "visited" : ""} ${isHead ? "active-head" : ""
                      } ${c === gridSize - 1 ? "last-col" : ""} ${r === gridSize - 1 ? "last-row" : ""
                      }`}
                  >
                    {numObj && (
                      <div
                        className={`zip-num-badge ${numObj.num === 1 && path.length === 1 ? "active-start" : ""
                          } ${visited ? "passed" : ""}`}
                      >
                        {numObj.num}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Orange flowing path drawn over the cells */}
          <svg
            className="zip-path-svg"
            viewBox={`0 0 ${gridSize} ${gridSize}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="zipFlow"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={gridSize}
                y2={gridSize}
              >
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="55%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {path.length > 1 && (
              <polyline
                points={pathPoints}
                fill="none"
                stroke="url(#zipFlow)"
                strokeWidth="0.56"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            <circle
              cx={head.col + 0.5}
              cy={head.row + 0.5}
              r="0.3"
              fill="#ea580c"
              className="zip-head-dot"
            />
          </svg>
        </div>
      </div>

      {/* ─── Controls ─── */}
      <div className="zip-controls-row">
        <button
          type="button"
          className="zip-ctrl-btn"
          onClick={handleUndo}
          disabled={path.length <= 1}
        >
          <RotateCcw size={16} />
          <span>Undo</span>
        </button>

        <button type="button" className="zip-ctrl-btn" onClick={handleHint}>
          <Lightbulb size={16} />
          <span>Hint</span>
        </button>

        <button type="button" className="zip-ctrl-btn" onClick={handleRestart}>
          <span>Restart</span>
        </button>
      </div>

      {/* ─── Celebration Modal (only after a correct solution) ─── */}
      {completedResult && (
        <div className="celebration-modal-overlay">
          <div className="celebration-modal-card">
            <div className="celebration-header-icon">🔢</div>
            <div className="celebration-puzzle-subtitle">
              Zip #{completedResult.puzzleNumber}
            </div>
            <h1 className="celebration-headline">You're crushing it!</h1>

            <div className="celebration-carousel-container">
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => setCarouselIndex((idx) => (idx === 0 ? 2 : idx - 1))}
              >
                <ChevronLeft size={20} />
              </button>

              {carouselIndex === 0 && (
                <div className="carousel-main-card">
                  <div
                    className="carousel-clock-icon"
                    style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
                  >
                    <Flame size={32} />
                  </div>
                  <div className="carousel-time-text">
                    {completedResult.newStreak} Days
                  </div>
                  <p className="carousel-avg-text">New streak! Game on!</p>
                </div>
              )}

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

              {carouselIndex === 2 && (
                <div className="carousel-main-card">
                  <div
                    className="carousel-clock-icon"
                    style={{ borderColor: "#10b981", color: "#10b981" }}
                  >
                    <Trophy size={32} />
                  </div>
                  <div className="carousel-time-text">{completedResult.percentile}</div>
                  <p className="carousel-avg-text">Of all Maatram players</p>
                </div>
              )}

              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => setCarouselIndex((idx) => (idx === 2 ? 0 : idx + 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="celebration-share-actions">
              <div className="share-action-item">
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
                  className="share-circle-btn"
                  onClick={handleCopyResult}
                  title="Copy Score Summary"
                >
                  {copiedText ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                </button>
                <span>{copiedText ? "Copied!" : "Copy"}</span>
              </div>
            </div>

            <button
              type="button"
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
import React, { useState, useEffect } from 'react';

// --- Constants ---
const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const PLAYER1 = 1; 
const PLAYER2 = 2;

export default function App() {
  const [appState, setAppState] = useState('welcome');
  const [gameMode, setGameMode] = useState('pve'); // 'pvp' or 'pve'
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Bot');
  
  // Customization
  const [p1Color, setP1Color] = useState('#222222');
  const [p2Color, setP2Color] = useState('#e74c3c');
  const [themeColor, setThemeColor] = useState('#2980b9');

  // Scores
  const [scores, setScores] = useState({ p1: 0, p2: 0, draw: 0 });

  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [winner, setWinner] = useState(null);

  // --- Game Logic ---
  const startGame = (e) => {
    e.preventDefault();
    if (!p1Name.trim()) setP1Name('Player 1');
    if (gameMode === 'pve') setP2Name('Bot');
    else if (!p2Name.trim()) setP2Name('Player 2');
    
    resetGame();
    setAppState('playing');
  };

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER1);
    setWinner(null);
    setAppState('playing');
  };

  const checkWin = (newBoard, row, col, player) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && newBoard[r][c] === player) count++; else break;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && newBoard[r][c] === player) count++; else break;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const checkWinGlobal = (currentBoard, player) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (currentBoard[r][c] === player) {
          if (c + 3 < COLS && currentBoard[r][c+1] === player && currentBoard[r][c+2] === player && currentBoard[r][c+3] === player) return true;
          if (r + 3 < ROWS) {
            if (currentBoard[r+1][c] === player && currentBoard[r+2][c] === player && currentBoard[r+3][c] === player) return true;
            if (c + 3 < COLS && currentBoard[r+1][c+1] === player && currentBoard[r+2][c+2] === player && currentBoard[r+3][c+3] === player) return true;
            if (c - 3 >= 0 && currentBoard[r+1][c-1] === player && currentBoard[r+2][c-2] === player && currentBoard[r+3][c-3] === player) return true;
          }
        }
      }
    }
    return false;
  };

  const dropToken = (colIndex, isBot = false) => {
    if (winner || appState !== 'playing') return;
    if (gameMode === 'pve' && currentPlayer === PLAYER2 && !isBot) return; // Prevent clicking when bot's turn

    const newBoard = board.map(row => [...row]);
    let placedRow = -1;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][colIndex] === EMPTY) {
        newBoard[r][colIndex] = currentPlayer;
        placedRow = r;
        break;
      }
    }

    if (placedRow === -1) return;

    setBoard(newBoard);

    if (checkWin(newBoard, placedRow, colIndex, currentPlayer)) {
      setWinner(currentPlayer);
      setAppState('gameover');
      if (currentPlayer === PLAYER1) setScores(s => ({ ...s, p1: s.p1 + 1 }));
      else setScores(s => ({ ...s, p2: s.p2 + 1 }));
      return;
    }

    if (newBoard[0].every(cell => cell !== EMPTY)) {
      setWinner('draw');
      setAppState('gameover');
      setScores(s => ({ ...s, draw: s.draw + 1 }));
      return;
    }

    setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
  };

  // --- BOT LOGIC ---
  useEffect(() => {
    if (appState === 'playing' && gameMode === 'pve' && currentPlayer === PLAYER2 && !winner) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, appState, winner, gameMode]);

  const makeBotMove = () => {
    const validLocations = getValidLocations(board);
    if (validLocations.length === 0) return;
    
    // First, check if bot can win instantly
    for (let col of validLocations) {
      let r = getNextOpenRow(board, col);
      let boardCopy = board.map(row => [...row]);
      boardCopy[r][col] = PLAYER2;
      if (checkWinGlobal(boardCopy, PLAYER2)) {
        dropToken(col, true);
        return;
      }
    }
    
    // Second, check if player can win instantly and block
    for (let col of validLocations) {
      let r = getNextOpenRow(board, col);
      let boardCopy = board.map(row => [...row]);
      boardCopy[r][col] = PLAYER1;
      if (checkWinGlobal(boardCopy, PLAYER1)) {
        dropToken(col, true);
        return;
      }
    }

    // Default: Minimax
    const { col } = minimax(board, 4, -Infinity, Infinity, true);
    if (col !== null) {
      dropToken(col, true);
    } else {
      // Fallback
      dropToken(validLocations[Math.floor(Math.random() * validLocations.length)], true);
    }
  };

  const getValidLocations = (b) => {
    let validLocations = [];
    for (let c = 0; c < COLS; c++) {
      if (b[0][c] === EMPTY) validLocations.push(c);
    }
    return validLocations;
  };

  const getNextOpenRow = (b, c) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][c] === EMPTY) return r;
    }
    return -1;
  };

  const scorePosition = (b, piece) => {
    let score = 0;
    // Center column preference
    let centerCol = [];
    for (let r = 0; r < ROWS; r++) centerCol.push(b[r][Math.floor(COLS/2)]);
    let centerCount = centerCol.filter(c => c === piece).length;
    score += centerCount * 3;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      let rowArray = b[r];
      for (let c = 0; c < COLS - 3; c++) {
        let window = rowArray.slice(c, c + 4);
        score += evaluateWindow(window, piece);
      }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
      let colArray = [];
      for (let r = 0; r < ROWS; r++) colArray.push(b[r][c]);
      for (let r = 0; r < ROWS - 3; r++) {
        let window = colArray.slice(r, r + 4);
        score += evaluateWindow(window, piece);
      }
    }
    // Diagonal \
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        let window = [b[r][c], b[r+1][c+1], b[r+2][c+2], b[r+3][c+3]];
        score += evaluateWindow(window, piece);
      }
    }
    // Diagonal /
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        let window = [b[r+3][c], b[r+2][c+1], b[r+1][c+2], b[r][c+3]];
        score += evaluateWindow(window, piece);
      }
    }
    return score;
  };

  const evaluateWindow = (window, piece) => {
    let score = 0;
    let oppPiece = piece === PLAYER1 ? PLAYER2 : PLAYER1;
    let pieceCount = window.filter(c => c === piece).length;
    let emptyCount = window.filter(c => c === EMPTY).length;
    let oppCount = window.filter(c => c === oppPiece).length;

    if (pieceCount === 4) {
      score += 100;
    } else if (pieceCount === 3 && emptyCount === 1) {
      score += 5;
    } else if (pieceCount === 2 && emptyCount === 2) {
      score += 2;
    }
    if (oppCount === 3 && emptyCount === 1) {
      score -= 4;
    }
    return score;
  };

  const isTerminalNode = (b) => {
    return checkWinGlobal(b, PLAYER1) || checkWinGlobal(b, PLAYER2) || getValidLocations(b).length === 0;
  };

  const minimax = (b, depth, alpha, beta, maximizingPlayer) => {
    let validLocations = getValidLocations(b);
    let isTerminal = isTerminalNode(b);
    if (depth === 0 || isTerminal) {
      if (isTerminal) {
        if (checkWinGlobal(b, PLAYER2)) {
          return { col: null, score: 100000000000000 - (4 - depth) }; // reward quicker wins
        } else if (checkWinGlobal(b, PLAYER1)) {
          return { col: null, score: -100000000000000 + (4 - depth) }; // penalize quicker losses
        } else {
          return { col: null, score: 0 };
        }
      } else {
        return { col: null, score: scorePosition(b, PLAYER2) - scorePosition(b, PLAYER1)*0.9 }; 
      }
    }
    
    // Scramble valid locations slightly to prevent repetitive bot behavior when scores are equal
    validLocations.sort(() => Math.random() - 0.5);

    if (maximizingPlayer) {
      let value = -Infinity;
      let bestCol = validLocations[Math.floor(Math.random() * validLocations.length)];
      for (let col of validLocations) {
        let row = getNextOpenRow(b, col);
        let bCopy = b.map(r => [...r]);
        bCopy[row][col] = PLAYER2;
        let newScore = minimax(bCopy, depth - 1, alpha, beta, false).score;
        if (newScore > value) {
          value = newScore;
          bestCol = col;
        }
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return { col: bestCol, score: value };
    } else {
      let value = Infinity;
      let bestCol = validLocations[Math.floor(Math.random() * validLocations.length)];
      for (let col of validLocations) {
        let row = getNextOpenRow(b, col);
        let bCopy = b.map(r => [...r]);
        bCopy[row][col] = PLAYER1;
        let newScore = minimax(bCopy, depth - 1, alpha, beta, true).score;
        if (newScore < value) {
          value = newScore;
          bestCol = col;
        }
        beta = Math.min(beta, value);
        if (alpha >= beta) break;
      }
      return { col: bestCol, score: value };
    }
  };


  // --- Render ---
  const cssStyles = `
  .app-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; color: #333; }
  .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 500px; margin: 20px;}
  h1 { margin-top: 0; color: #2c3e50; }
  .input-group { margin-bottom: 15px; text-align: left; }
  .input-group label { display: block; margin-bottom: 5px; font-weight: bold; }
  .input-group input[type="text"], .input-group select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
  .color-picker { margin-top: 5px; height: 40px; padding: 0 !important; cursor: pointer; border-radius: 6px; width: 100%; border: 1px solid #ccc; }
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  button { background-color: #3498db; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 6px; cursor: pointer; transition: background 0.3s; margin-top: 10px; }
  button:hover { background-color: #2980b9; }
  
  .game-header { text-align: center; margin-bottom: 15px; width: 100%; max-width: 600px; display: flex; justify-content: space-between; align-items: center; }
  .turn-indicator { font-size: 1.2rem; font-weight: bold; padding: 10px 20px; border-radius: 8px; flex-grow: 1; text-align: center; margin: 0 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.3s; }
  
  .score-card { background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 80px; text-align: center; }
  .score-name { font-size: 0.8rem; font-weight: bold; color: #7f8c8d; text-transform: uppercase; margin-bottom: 5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;}
  .score-val { font-size: 1.5rem; font-weight: bold; color: #2c3e50; transition: color 0.3s;}

  .board { padding: 10px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: inline-block; cursor: crosshair; transition: background-color 0.3s;}
  .row { display: flex; }
  .cell { width: 60px; height: 60px; background-color: #ecf0f1; border-radius: 50%; margin: 5px; cursor: pointer; box-shadow: inset 0 6px 10px rgba(0,0,0,0.4); transition: transform 0.1s, background-color 0.3s; }
  .cell:hover { transform: scale(1.05); }
  
  .winner-text { font-size: 2rem; color: #27ae60; margin-bottom: 20px; animation: pop 0.5s ease-out; }
  @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  `;

  return (
    <div className="app-container">
      <style>{cssStyles}</style>
      
      {appState === 'welcome' && (
        <div className="card">
          <h1>Connect 4</h1>
          <form onSubmit={startGame}>
            <div className="input-group">
              <label>Game Mode</label>
              <select value={gameMode} onChange={e => {
                setGameMode(e.target.value);
                if (e.target.value === 'pve') setP2Name('Bot');
                else setP2Name('Player 2');
              }}>
                <option value="pve">🆚 Player vs Bot (AI)</option>
                <option value="pvp">👥 Player vs Player</option>
              </select>
            </div>

            <div className="settings-grid">
              <div className="input-group">
                <label>Player 1 Name</label>
                <input type="text" value={p1Name} onChange={e => setP1Name(e.target.value)} required />
                <input type="color" className="color-picker" value={p1Color} onChange={e => setP1Color(e.target.value)} title="Choose Token Color" />
              </div>
              <div className="input-group">
                <label>{gameMode === 'pve' ? 'Bot Name' : 'Player 2 Name'}</label>
                <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)} required disabled={gameMode === 'pve'} />
                <input type="color" className="color-picker" value={p2Color} onChange={e => setP2Color(e.target.value)} title="Choose Token Color" />
              </div>
            </div>
            
            <div className="input-group" style={{marginTop: '10px'}}>
              <label>Board Theme (Background Color)</label>
              <input type="color" className="color-picker" value={themeColor} onChange={e => setThemeColor(e.target.value)} />
            </div>

            <button type="submit" style={{width: '100%', fontSize: '1.2rem', padding: '15px'}}>Start Game</button>
          </form>
        </div>
      )}

      {(appState === 'playing' || appState === 'gameover') && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div className="game-header">
            <div className="score-card">
              <div className="score-name">{p1Name}</div>
              <div className="score-val" style={{color: p1Color}}>{scores.p1}</div>
            </div>
            
            <div 
              className="turn-indicator" 
              style={{
                backgroundColor: currentPlayer === PLAYER1 ? p1Color : p2Color,
                color: '#fff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {appState === 'gameover' ? 'Game Over' : `${currentPlayer === PLAYER1 ? p1Name : p2Name}'s Turn`}
            </div>
            
            <div className="score-card">
              <div className="score-name">{p2Name}</div>
              <div className="score-val" style={{color: p2Color}}>{scores.p2}</div>
            </div>
          </div>
          
          <div className="board" style={{backgroundColor: themeColor}}>
            {board.map((row, rIndex) => (
              <div key={rIndex} className="row">
                {row.map((cell, cIndex) => {
                  let bgColor = '#ecf0f1';
                  if (cell === PLAYER1) bgColor = p1Color;
                  if (cell === PLAYER2) bgColor = p2Color;
                  
                  return (
                    <div 
                      key={cIndex} 
                      className="cell" 
                      style={{ 
                        backgroundColor: bgColor,
                        boxShadow: cell !== EMPTY ? 'inset 0 -4px 8px rgba(0,0,0,0.6)' : 'inset 0 6px 10px rgba(0,0,0,0.4)',
                        cursor: (appState !== 'playing' || (gameMode === 'pve' && currentPlayer === PLAYER2)) ? 'not-allowed' : 'pointer',
                        opacity: appState === 'gameover' && cell === EMPTY ? 0.7 : 1
                      }}
                      onClick={() => dropToken(cIndex)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {appState === 'playing' ? (
            <button onClick={() => setAppState('welcome')} style={{marginTop: '20px', background: '#e74c3c'}}>Home Settings</button>
          ) : (
            <div className="card" style={{marginTop: '20px', padding: '1.5rem', maxWidth: '400px'}}>
              <h2 className="winner-text">
                {winner === 'draw' ? "It's a Draw!" : `Congratulations ${winner === PLAYER1 ? p1Name : p2Name}!`}
              </h2>
              <p>{winner !== 'draw' ? 'You won the round! 🔥' : 'No more moves left.'}</p>
              <div style={{marginTop: '15px'}}>
                <button onClick={resetGame}>Play Again</button>
                <button onClick={() => setAppState('welcome')} style={{ background: '#95a5a6', marginLeft: '10px' }}>Home Settings</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
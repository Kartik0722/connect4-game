import React, { useState } from 'react';

// --- CSS Styles ---
const cssStyles = `
  .app-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; color: #333; }
  .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 400px; }
  h1 { margin-top: 0; color: #2c3e50; }
  .input-group { margin-bottom: 15px; text-align: left; }
  .input-group label { display: block; margin-bottom: 5px; font-weight: bold; }
  .input-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
  button { background-color: #3498db; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 6px; cursor: pointer; transition: background 0.3s; margin-top: 10px; }
  button:hover { background-color: #2980b9; }
  
  .game-header { text-align: center; margin-bottom: 20px; }
  .turn-indicator { font-size: 1.2rem; font-weight: bold; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 10px;}
  .turn-black { background-color: #222; color: white; }
  .turn-red { background-color: #e74c3c; color: white; }
  
  .board { background-color: #2980b9; padding: 10px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: inline-block; }
  .row { display: flex; }
  .cell { width: 60px; height: 60px; background-color: #ecf0f1; border-radius: 50%; margin: 5px; cursor: pointer; box-shadow: inset 0 6px 10px rgba(0,0,0,0.4); transition: transform 0.1s; }
  .cell:hover { transform: scale(1.05); }
  .cell.p1 { background-color: #222; box-shadow: inset 0 -4px 8px rgba(0,0,0,0.6); }
  .cell.p2 { background-color: #e74c3c; box-shadow: inset 0 -4px 8px rgba(0,0,0,0.6); }
  
  .winner-text { font-size: 2rem; color: #27ae60; margin-bottom: 20px; animation: pop 0.5s ease-out; }
  @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
`;

// --- Constants ---
const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const PLAYER1 = 1; // Black
const PLAYER2 = 2; // Red

export default function App() {
  // Application State: 'welcome', 'playing', 'gameover'
  const [appState, setAppState] = useState('welcome');
  
  // Player Data
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  
  // Game State
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [winner, setWinner] = useState(null); // null, 1, 2, or 'draw'

  // --- Game Logic ---
  const startGame = (e) => {
    e.preventDefault();
    if (!p1Name.trim()) setP1Name('Player 1');
    if (!p2Name.trim()) setP2Name('Player 2');
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
    const directions = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Diagonal right-down
      [1, -1]  // Diagonal left-down
    ];

    for (let [dr, dc] of directions) {
      let count = 1;
      // Check forward direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && newBoard[r][c] === player) count++;
        else break;
      }
      // Check backward direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && newBoard[r][c] === player) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const dropToken = (colIndex) => {
    if (winner || appState !== 'playing') return;

    const newBoard = board.map(row => [...row]);
    let placedRow = -1;

    // Find the lowest empty cell in the selected column
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][colIndex] === EMPTY) {
        newBoard[r][colIndex] = currentPlayer;
        placedRow = r;
        break;
      }
    }

    // Column is full
    if (placedRow === -1) return;

    setBoard(newBoard);

    // Check for win
    if (checkWin(newBoard, placedRow, colIndex, currentPlayer)) {
      setWinner(currentPlayer);
      setAppState('gameover');
      return;
    }

    // Check for draw
    if (newBoard[0].every(cell => cell !== EMPTY)) {
      setWinner('draw');
      setAppState('gameover');
      return;
    }

    // Switch player
    setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
  };

  // --- Render Functions ---
  const renderWelcome = () => (
    <div className="card">
      <h1>Connect 4</h1>
      <form onSubmit={startGame}>
        <div className="input-group">
          <label>Black Token Player:</label>
          <input type="text" value={p1Name} onChange={(e) => setP1Name(e.target.value)} placeholder="Enter name" required />
        </div>
        <div className="input-group">
          <label>Red Token Player:</label>
          <input type="text" value={p2Name} onChange={(e) => setP2Name(e.target.value)} placeholder="Enter name" required />
        </div>
        <button type="submit">Start Game</button>
      </form>
    </div>
  );

  const renderGame = () => (
    <div>
      <div className="game-header">
        <div className={`turn-indicator ${currentPlayer === PLAYER1 ? 'turn-black' : 'turn-red'}`}>
          {currentPlayer === PLAYER1 ? p1Name : p2Name}'s Turn
        </div>
      </div>
      <div className="board">
        {board.map((row, rIndex) => (
          <div key={rIndex} className="row">
            {row.map((cell, cIndex) => {
              let cellClass = "cell";
              if (cell === PLAYER1) cellClass += " p1";
              if (cell === PLAYER2) cellClass += " p2";
              return (
                <div 
                  key={cIndex} 
                  className={cellClass} 
                  onClick={() => dropToken(cIndex)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
         <button onClick={() => setAppState('welcome')}>Quit Game</button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="card">
      <h2 className="winner-text">
        {winner === 'draw' ? "It's a Draw!" : `Congratulations ${winner === PLAYER1 ? p1Name : p2Name}!`}
      </h2>
      <p>{winner !== 'draw' ? 'You won the game!' : 'No more moves left.'}</p>
      <button onClick={resetGame}>Play Again</button>
      <button onClick={() => setAppState('welcome')} style={{ background: '#7f8c8d', marginLeft: '10px' }}>Home</button>
    </div>
  );

  return (
    <div className="app-container">
      <style>{cssStyles}</style>
      {appState === 'welcome' && renderWelcome()}
      {appState === 'playing' && renderGame()}
      {appState === 'gameover' && renderGameOver()}
    </div>
  );
}
import { useState } from 'react';
import './Lobby.css';

function Lobby({ onJoinGame, initialGameId }) {
  const [gameId, setGameId] = useState(initialGameId || '');

  const handleJoin = () => {
    if (gameId.trim()) {
      onJoinGame(gameId.trim());
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-content">
        <h1>🎴 21 Очко</h1>
        <p className="subtitle">Введите ID игры для подключения</p>
        
        <div className="join-form">
          <input
            type="text"
            placeholder="ID игры"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="game-id-input"
          />
          <button 
            onClick={handleJoin}
            className="join-button"
            disabled={!gameId.trim()}
          >
            Присоединиться
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;

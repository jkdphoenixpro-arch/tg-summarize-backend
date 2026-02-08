import { useState, useEffect } from 'react';
import './Lobby.css';

function Lobby({ onJoinGame, initialGameId, user, socketUrl }) {
  const [gameId, setGameId] = useState(initialGameId || '');
  const [bet, setBet] = useState(20);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const MIN_BET = 20;
  const MAX_BET = 300;

  useEffect(() => {
    // Загружаем баланс игрока
    if (user && socketUrl) {
      fetchBalance();
    }
  }, [user, socketUrl]);

  const fetchBalance = async () => {
    try {
      const response = await fetch(`${socketUrl}/api/player/${user.userId}`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.player.balance);
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error);
      setBalance(1000); // Дефолтный баланс
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (gameId.trim() && bet >= MIN_BET && bet <= MAX_BET) {
      onJoinGame(gameId.trim(), bet);
    }
  };

  const handleBetChange = (value) => {
    const numValue = parseInt(value) || MIN_BET;
    setBet(Math.max(MIN_BET, Math.min(MAX_BET, numValue)));
  };

  const canAffordBet = balance !== null && balance >= bet;

  return (
    <div className="lobby">
      <div className="lobby-content">
        <h1>🎴 21 Очко</h1>
        
        {loading ? (
          <p className="loading-text">Загрузка...</p>
        ) : (
          <>
            <div className="balance-card">
              <div className="balance-label">Ваш баланс</div>
              <div className="balance-amount">{balance}₽</div>
            </div>

            <div className="join-form">
              <input
                type="text"
                placeholder="ID игры"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="game-id-input"
              />

              <div className="bet-section">
                <label className="bet-label">Ставка</label>
                <div className="bet-controls">
                  <button 
                    className="bet-btn"
                    onClick={() => handleBetChange(bet - 10)}
                    disabled={bet <= MIN_BET}
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    value={bet}
                    onChange={(e) => handleBetChange(e.target.value)}
                    className="bet-input"
                    min={MIN_BET}
                    max={MAX_BET}
                  />
                  <button 
                    className="bet-btn"
                    onClick={() => handleBetChange(bet + 10)}
                    disabled={bet >= MAX_BET || bet + 10 > balance}
                  >
                    +10
                  </button>
                </div>
                <div className="bet-info">
                  Мин: {MIN_BET}₽ | Макс: {MAX_BET}₽
                </div>
              </div>

              {!canAffordBet && (
                <div className="error-message">
                  ❌ Недостаточно средств
                </div>
              )}

              <button 
                onClick={handleJoin}
                className="join-button"
                disabled={!gameId.trim() || !canAffordBet}
              >
                Присоединиться ({bet}₽)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Lobby;

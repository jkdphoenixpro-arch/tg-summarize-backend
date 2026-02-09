import { useState, useEffect } from 'react';
import Card from './Card';
import { hapticFeedback } from '../utils/telegram';
import './Game.css';

function Game({ gameState, socket, user, gameId }) {
  const [canAct, setCanAct] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') {
      setCanAct(false);
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const myPlayer = gameState.players.find(p => p.userId === user.userId);
    
    setCanAct(
      currentPlayer?.userId === user.userId && 
      myPlayer?.status === 'active'
    );

    // Обновляем оставшееся время
    if (gameState.remainingTime !== undefined) {
      setRemainingTime(gameState.remainingTime);
    }
  }, [gameState, user]);

  useEffect(() => {
    // Слушаем событие таймаута
    const handleTimeout = ({ userId }) => {
      if (userId === user.userId) {
        setShowTimeoutMessage(true);
        setTimeout(() => setShowTimeoutMessage(false), 3000);
      }
    };

    socket.on('turn_timeout', handleTimeout);

    return () => {
      socket.off('turn_timeout', handleTimeout);
    };
  }, [socket, user]);

  const handleHit = () => {
    hapticFeedback('light');
    socket.emit('hit', { gameId, userId: user.userId });
  };

  const handleStand = () => {
    hapticFeedback('medium');
    socket.emit('stand', { gameId, userId: user.userId });
  };

  const handleStart = () => {
    hapticFeedback('success');
    socket.emit('start_game', { gameId, userId: user.userId });
  };

  if (!gameState) return null;

  const myPlayer = gameState.players.find(p => p.userId === user.userId);
  const otherPlayers = gameState.players.filter(p => p.userId !== user.userId);
  const isWaiting = gameState.status === 'waiting';
  const isFinished = gameState.status === 'finished';
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.userId === user.userId && myPlayer?.status === 'active';

  // Определяем цвет таймера
  const getTimerColor = () => {
    if (remainingTime <= 5) return '#ff4444';
    if (remainingTime <= 10) return '#ff9800';
    return '#4caf50';
  };

  return (
    <div className="game">
      {/* Баланс игрока */}
      {myPlayer && myPlayer.balance !== undefined && (
        <div className="game-balance">
          💰 Баланс: {myPlayer.balance}₽
        </div>
      )}

      {/* Таймер хода */}
      {gameState.status === 'playing' && !isFinished && (
        <div className="turn-timer-container">
          <div 
            className={`turn-timer ${remainingTime <= 10 ? 'warning' : ''} ${remainingTime <= 5 ? 'critical' : ''}`}
            style={{ '--timer-color': getTimerColor() }}
          >
            <div className="timer-icon">⏱️</div>
            <div className="timer-value">{remainingTime}с</div>
          </div>
          {isMyTurn && (
            <div className="timer-label">Ваш ход</div>
          )}
        </div>
      )}

      {/* Сообщение о таймауте */}
      {showTimeoutMessage && (
        <div className="timeout-message">
          ⏰ Время вышло! Автоматический пас
        </div>
      )}

      {/* Дилер */}
      <div className="dealer-section">
        <div className="dealer-info">
          <span className="dealer-label">🎩 Дилер</span>
          <span className="score">{gameState.dealer.score}</span>
        </div>
        <div className="cards-container">
          {gameState.dealer.cards.map((card, idx) => (
            <Card 
              key={idx} 
              card={card} 
              hidden={!isFinished && idx === 1}
            />
          ))}
        </div>
      </div>

      {/* Другие игроки */}
      {otherPlayers.length > 0 && (
        <div className="other-players">
          {otherPlayers.map((player) => {
            const resultIcon = isFinished && player.result 
              ? (player.result === 'win' ? '🏆' : player.result === 'push' ? '🤝' : '❌')
              : '';
            
            return (
              <div 
                key={player.userId} 
                className={`player-mini ${isFinished && player.result ? `result-${player.result}` : ''}`}
              >
                <div className="player-header">
                  <span className="player-name">
                    {resultIcon && <span className="result-icon">{resultIcon}</span>}
                    {player.username}
                  </span>
                  <span className="score">{player.score}</span>
                </div>
                {player.bet && (
                  <div className="player-bet">Ставка: {player.bet}₽</div>
                )}
                <div className="cards-mini">
                  {player.cards.map((card, idx) => (
                    <Card key={idx} card={card} mini />
                  ))}
                </div>
                {player.status === 'busted' && <span className="status-badge bust">Перебор</span>}
                {player.status === 'stand' && <span className="status-badge stand">Пас</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Текущий игрок */}
      {myPlayer && (
        <div className={`my-player ${isFinished && myPlayer.result ? `result-${myPlayer.result}` : ''}`}>
          <div className="player-info">
            <div>
              <div className="player-name">
                {isFinished && myPlayer.result && (
                  <span className="result-icon">
                    {myPlayer.result === 'win' ? '🎉' : myPlayer.result === 'push' ? '🤝' : '😔'}
                  </span>
                )}
                Вы: {myPlayer.username}
              </div>
              {myPlayer.bet && (
                <div className="my-bet">Ставка: {myPlayer.bet}₽</div>
              )}
            </div>
            <span className="score large">{myPlayer.score}</span>
          </div>
          <div className="cards-container">
            {myPlayer.cards.map((card, idx) => (
              <Card key={idx} card={card} />
            ))}
          </div>
          {myPlayer.status === 'busted' && (
            <div className="status-message bust">💥 Перебор!</div>
          )}
          {myPlayer.status === 'stand' && (
            <div className="status-message stand">✋ Вы спасовали</div>
          )}
          {isFinished && myPlayer.result && (
            <div className="result-compact">
              {myPlayer.result === 'win' ? `+${myPlayer.bet}₽` : 
               myPlayer.result === 'push' ? 'Возврат ставки' : `-${myPlayer.bet}₽`}
            </div>
          )}
        </div>
      )}

      {/* Кнопки управления */}
      <div className="controls">
        {isWaiting && (
          <>
            <div className="waiting-info">
              <p>Игроков: {gameState.players.length}/6</p>
              <p className="hint">Минимум 2 игрока для старта</p>
            </div>
            <button 
              onClick={handleStart}
              className="btn-primary"
              disabled={gameState.players.length < 2}
            >
              Начать игру
            </button>
          </>
        )}

        {gameState.status === 'playing' && canAct && (
          <div className="action-buttons">
            <button onClick={handleHit} className="btn-hit">
              🃏 Взять карту
            </button>
            <button onClick={handleStand} className="btn-stand">
              ✋ Пас
            </button>
          </div>
        )}

        {gameState.status === 'playing' && !canAct && !isFinished && (
          <div className="waiting-turn">
            Ход игрока: {gameState.players[gameState.currentPlayerIndex]?.username}
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;

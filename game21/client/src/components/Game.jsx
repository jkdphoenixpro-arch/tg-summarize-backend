import { useState, useEffect } from 'react';
import Card from './Card';
import { hapticFeedback } from '../utils/telegram';
import './Game.css';

function Game({ gameState, socket, user, gameId }) {
  const [canAct, setCanAct] = useState(false);

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
  }, [gameState, user]);

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

  return (
    <div className="game">
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
          {otherPlayers.map((player) => (
            <div key={player.userId} className="player-mini">
              <div className="player-header">
                <span className="player-name">{player.username}</span>
                <span className="score">{player.score}</span>
              </div>
              <div className="cards-mini">
                {player.cards.map((card, idx) => (
                  <Card key={idx} card={card} mini />
                ))}
              </div>
              {player.status === 'busted' && <span className="status-badge bust">Перебор</span>}
              {player.status === 'stand' && <span className="status-badge stand">Пас</span>}
              {isFinished && player.result && (
                <span className={`result-badge ${player.result}`}>
                  {player.result === 'win' ? '🏆 Победа' : 
                   player.result === 'push' ? '🤝 Ничья' : '❌ Проигрыш'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Текущий игрок */}
      {myPlayer && (
        <div className="my-player">
          <div className="player-info">
            <span className="player-name">Вы: {myPlayer.username}</span>
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
            <div className={`result-message ${myPlayer.result}`}>
              {myPlayer.result === 'win' ? '🎉 Вы выиграли!' : 
               myPlayer.result === 'push' ? '🤝 Ничья' : '😔 Вы проиграли'}
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

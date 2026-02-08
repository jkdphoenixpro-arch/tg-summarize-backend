import './Card.css';

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: '#e74c3c',
  diamonds: '#e74c3c',
  clubs: '#2c3e50',
  spades: '#2c3e50'
};

function Card({ card, hidden, mini }) {
  if (hidden) {
    return (
      <div className={`card card-back ${mini ? 'mini' : ''}`}>
        <div className="card-pattern"></div>
      </div>
    );
  }

  const suitSymbol = suitSymbols[card.suit];
  const color = suitColors[card.suit];

  return (
    <div className={`card ${mini ? 'mini' : ''}`}>
      <div className="card-content" style={{ color }}>
        <div className="card-corner top-left">
          <div className="rank">{card.rank}</div>
          <div className="suit">{suitSymbol}</div>
        </div>
        <div className="card-center">
          <span className="suit-large">{suitSymbol}</span>
        </div>
        <div className="card-corner bottom-right">
          <div className="rank">{card.rank}</div>
          <div className="suit">{suitSymbol}</div>
        </div>
      </div>
    </div>
  );
}

export default Card;

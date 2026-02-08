import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 1000,
    min: 0
  },
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    gamesLost: {
      type: Number,
      default: 0
    },
    gamesPush: {
      type: Number,
      default: 0
    },
    totalWinnings: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  }
});

// Метод для получения или создания игрока
playerSchema.statics.getOrCreate = async function(userId, username) {
  let player = await this.findOne({ userId });
  
  if (!player) {
    player = await this.create({
      userId,
      username,
      balance: 1000
    });
    console.log(`✨ Создан новый игрок: ${username} (${userId}) с балансом 1000`);
  }
  
  return player;
};

// Метод для обновления баланса после игры
playerSchema.methods.updateAfterGame = async function(result, bet) {
  this.stats.gamesPlayed += 1;
  this.lastPlayed = new Date();
  
  if (result === 'win') {
    this.balance += bet;
    this.stats.gamesWon += 1;
    this.stats.totalWinnings += bet;
  } else if (result === 'lose') {
    this.balance -= bet;
    this.stats.gamesLost += 1;
    this.stats.totalLosses += bet;
  } else if (result === 'push') {
    this.stats.gamesPush += 1;
  }
  
  await this.save();
  
  console.log(`💰 ${this.username}: ${result} | Ставка: ${bet} | Баланс: ${this.balance}`);
};

// Метод для проверки может ли игрок сделать ставку
playerSchema.methods.canBet = function(amount) {
  return this.balance >= amount;
};

const Player = mongoose.model('Player', playerSchema);

export default Player;

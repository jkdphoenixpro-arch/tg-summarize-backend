import mongoose from 'mongoose';

export async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.log('⚠️  MONGODB_URI не указан в .env');
      console.log('💡 Игра будет работать без сохранения статистики');
      return null;
    }

    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB подключена');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.log('💡 Игра будет работать без сохранения статистики');
    return null;
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

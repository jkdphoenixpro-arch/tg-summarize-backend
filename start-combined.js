import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Запуск Combined Bot + Game Backend...');
console.log('');

// Проверяем и устанавливаем зависимости для game21/server
if (!existsSync('game21/server/node_modules')) {
  console.log('📦 Установка зависимостей для game21/server...');
  try {
    execSync('cd game21/server && npm install', { stdio: 'inherit' });
    console.log('✅ Зависимости установлены');
  } catch (error) {
    console.error('❌ Ошибка установки зависимостей:', error.message);
    process.exit(1);
  }
}

// Запускаем Game Backend
console.log('1️⃣ Запуск Game Backend (порт 3001)...');
const backend = spawn('node', ['game21/server/server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Ждем 3 секунды чтобы backend успел запуститься
setTimeout(() => {
  console.log('');
  console.log('2️⃣ Запуск Telegram Bot...');
  
  // Запускаем Telegram Bot
  const bot = spawn('node', ['combined-bot.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error);
  });

  bot.on('exit', (code) => {
    console.log(`🤖 Бот завершился с кодом ${code}`);
    backend.kill();
    process.exit(code);
  });
}, 3000);

backend.on('error', (error) => {
  console.error('❌ Ошибка backend:', error);
});

backend.on('exit', (code) => {
  console.log(`🎮 Backend завершился с кодом ${code}`);
  process.exit(code);
});

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log('⏹️ Получен SIGTERM, завершаем процессы...');
  backend.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏹️ Получен SIGINT, завершаем процессы...');
  backend.kill();
  process.exit(0);
});

console.log('');
console.log('✅ Оба сервиса запущены!');
console.log('📊 Логи будут отображаться ниже...');
console.log('');

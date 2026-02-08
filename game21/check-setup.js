#!/usr/bin/env node

import { createClient } from 'redis';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Проверка настройки игры 21 Очко...\n');

let allGood = true;

// Проверка 1: package.json файлы
console.log('📦 Проверка package.json файлов...');
const packageFiles = [
  'package.json',
  'server/package.json',
  'client/package.json'
];

for (const file of packageFiles) {
  const path = join(__dirname, file);
  if (fs.existsSync(path)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} не найден`);
    allGood = false;
  }
}

// Проверка 2: node_modules
console.log('\n📚 Проверка установленных зависимостей...');
const nodeModules = [
  'node_modules',
  'server/node_modules',
  'client/node_modules'
];

for (const dir of nodeModules) {
  const path = join(__dirname, dir);
  if (fs.existsSync(path)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ⚠️  ${dir} не найден - запусти: npm run install:all`);
    allGood = false;
  }
}

// Проверка 3: .env файлы
console.log('\n⚙️  Проверка .env файлов...');
const envFiles = [
  { path: 'server/.env', required: ['PORT', 'REDIS_URL'] },
  { path: 'client/.env', required: ['VITE_SOCKET_URL'] }
];

for (const { path, required } of envFiles) {
  const fullPath = join(__dirname, path);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${path} существует`);
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    for (const key of required) {
      if (content.includes(key)) {
        console.log(`    ✅ ${key} настроен`);
      } else {
        console.log(`    ⚠️  ${key} не найден`);
      }
    }
  } else {
    console.log(`  ⚠️  ${path} не найден - создай из ${path}.example`);
  }
}

// Проверка 4: Redis подключение
console.log('\n🔴 Проверка Redis...');
try {
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 3000
    }
  });

  redis.on('error', () => {});

  await redis.connect();
  const pong = await redis.ping();
  
  if (pong === 'PONG') {
    console.log('  ✅ Redis подключен и работает');
  }
  
  await redis.disconnect();
} catch (error) {
  console.log('  ❌ Redis не доступен');
  console.log('  💡 Запусти: docker run -d -p 6379:6379 redis');
  allGood = false;
}

// Итог
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Всё готово! Можешь запускать игру:');
  console.log('   npm run dev');
} else {
  console.log('⚠️  Есть проблемы. Смотри инструкции выше.');
  console.log('📖 Полная инструкция: GAME21-SETUP.md');
}
console.log('='.repeat(50));

process.exit(allGood ? 0 : 1);

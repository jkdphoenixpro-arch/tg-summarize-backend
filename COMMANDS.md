# ⚡ Быстрые команды

Все команды которые могут понадобиться.

## 🚀 Установка

```bash
# Зависимости бота
npm install

# Зависимости игры
npm run game:install

# Всё сразу
npm install && npm run game:install
```

## 🎮 Запуск

```bash
# Бот
npm run combined              # Запустить
npm run combined:dev          # С автоперезагрузкой

# Игра
npm run game:dev              # Всё вместе
npm run game:server           # Только backend
npm run game:client           # Только frontend

# Userbot
npm run userbot               # Настройка
```

## 🔴 Redis

```bash
# In-Memory (без Redis) - для разработки
# В game21/server/.env добавь:
USE_MEMORY_STORAGE=true

# Docker
docker run -d -p 6379:6379 --name redis redis
docker start redis
docker stop redis
docker restart redis

# Проверка
redis-cli ping
redis-cli KEYS game:*
redis-cli GET game:game_123
redis-cli FLUSHALL

# WSL (Windows Subsystem for Linux)
wsl --install
sudo apt install redis-server
sudo service redis-server start

# Linux
sudo systemctl start redis
sudo systemctl stop redis
sudo systemctl restart redis
sudo systemctl status redis

# macOS
brew services start redis
brew services stop redis
brew services restart redis

# Memurai (Windows)
# Скачай с https://www.memurai.com/get-memurai
# Запускается автоматически как служба Windows
```

## 🧪 Тестирование

```bash
# Проверка настройки игры
cd game21
npm run check

# Открыть игру в браузере
# http://localhost:5173?gameId=test123

# Проверка Redis
redis-cli ping

# Проверка портов
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173
netstat -ano | findstr :6379

# Linux/Mac
lsof -i :3001
lsof -i :5173
lsof -i :6379
```

## 📦 Сборка

```bash
# Сборка клиента
cd game21/client
npm run build

# Предпросмотр
npm run preview
```

## 🌐 Деплой

```bash
# Railway (Backend)
cd game21/server
railway login
railway init
railway up
railway logs
railway restart

# Vercel (Frontend)
cd game21/client
vercel login
vercel
vercel --prod
vercel logs

# Heroku (Бот)
heroku login
heroku create
heroku config:set KEY=value
git push heroku main
heroku logs --tail
heroku restart
```

## 🐛 Отладка

```bash
# Логи бота
npm run combined

# Логи игры
npm run game:dev

# Логи Redis
redis-cli MONITOR

# Логи Railway
railway logs

# Логи Vercel
vercel logs

# Логи Heroku
heroku logs --tail

# Логи PM2 (VPS)
pm2 logs telegram-bot
pm2 status
pm2 restart telegram-bot
```

## 🔧 Управление процессами (VPS)

```bash
# PM2
pm2 start combined-bot.js --name telegram-bot
pm2 stop telegram-bot
pm2 restart telegram-bot
pm2 delete telegram-bot
pm2 logs telegram-bot
pm2 status
pm2 save
pm2 startup

# Systemd
sudo systemctl start telegram-bot
sudo systemctl stop telegram-bot
sudo systemctl restart telegram-bot
sudo systemctl status telegram-bot
sudo systemctl enable telegram-bot
```

## 📊 Мониторинг

```bash
# Redis статистика
redis-cli INFO
redis-cli INFO stats
redis-cli DBSIZE

# Игры в Redis
redis-cli KEYS game:*
redis-cli TTL game:game_123

# Память
redis-cli INFO memory

# Клиенты
redis-cli CLIENT LIST
```

## 🧹 Очистка

```bash
# Очистить node_modules
rm -rf node_modules
rm -rf game21/server/node_modules
rm -rf game21/client/node_modules

# Очистить Redis
redis-cli FLUSHALL
redis-cli FLUSHDB

# Очистить build
rm -rf game21/client/dist

# Очистить логи PM2
pm2 flush
```

## 🔄 Обновление

```bash
# Обновить зависимости
npm update
cd game21/server && npm update
cd game21/client && npm update

# Проверить устаревшие
npm outdated
```

## 📝 Git

```bash
# Инициализация
git init
git add .
git commit -m "Initial commit"

# Обновление
git add .
git commit -m "Update"
git push

# Клонирование
git clone <repo-url>
cd <repo-name>
npm install
npm run game:install
```

## 🔐 Переменные окружения

```bash
# Создать .env
cp .env.example .env
nano .env

# Создать для игры
cp game21/server/.env.example game21/server/.env
cp game21/client/.env.example game21/client/.env

# Проверить
cat .env
```

## 🌍 Ngrok (для локального HTTPS)

```bash
# Установка
# Windows: choco install ngrok
# Mac: brew install ngrok
# Linux: snap install ngrok

# Запуск
ngrok http 5173          # Frontend
ngrok http 3001          # Backend

# С поддоменом
ngrok http 5173 --subdomain=mygame
```

## 📱 Telegram команды

```
/start          - Начать
/status         - Статистика (личка)
/analyze        - Анализ (личка)
/save           - Сохранить историю (личка)
/clear          - Очистить (личка)
/summarize      - Суммаризация (группа)
/opros          - Опрос (группа)
/game21         - Игра (группа)
```

## 🎯 Быстрый старт (копипаста)

```bash
# 1. Клонировать и установить
git clone <repo>
cd <repo>
npm install
npm run game:install

# 2. Настроить
cp .env.example .env
nano .env
cp game21/server/.env.example game21/server/.env
cp game21/client/.env.example game21/client/.env

# 3. Запустить Redis
docker run -d -p 6379:6379 redis

# 4. Проверить
cd game21
npm run check

# 5. Запустить
npm run dev

# 6. Запустить бота (новый терминал)
cd ..
npm run combined
```

## 🆘 Экстренные команды

```bash
# Убить процесс на порту
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Перезапустить всё
pm2 restart all
docker restart redis

# Очистить всё
redis-cli FLUSHALL
pm2 delete all
rm -rf node_modules
npm install
```

## 📚 Полезные ссылки

```bash
# Локальные URL
http://localhost:3001          # Backend
http://localhost:5173          # Frontend
http://localhost:5173?gameId=test  # Тест игры

# Документация
cat README.md
cat game21/README.md
cat game21/QUICK-START.md
cat game21/FAQ.md
```

---

**Сохрани этот файл в закладки!** 📌

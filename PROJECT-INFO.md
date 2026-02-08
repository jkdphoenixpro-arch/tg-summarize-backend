# 📊 Информация о проекте

## 🎯 Обзор

Этот проект объединяет два основных компонента:

1. **Combined Bot** - Многофункциональный Telegram бот с AI
2. **Game 21** - Многопользовательская карточная игра

## 📦 Компоненты

### 1. Combined Bot (Основной бот)

**Файлы:**
- `combined-bot.js` - Основной код бота
- `userbot-collector.js` - Сбор истории сообщений
- `collector-bot.js` - Альтернативный коллектор

**Возможности:**
- ✅ Суммаризация чата через Groq AI
- ✅ Создание мемных опросов
- ✅ Сбор и анализ истории
- ✅ Интеграция с игрой 21 Очко

**Зависимости:**
- telegraf (Telegram Bot API)
- groq-sdk (AI суммаризация)
- telegram (Userbot)
- tiktoken (подсчет токенов)

### 2. Game 21 (Игра в 21 Очко)

**Структура:**
```
game21/
├── server/          # Backend
│   ├── server.js
│   └── gameManager.js
├── client/          # Frontend
│   └── src/
└── docs/           # Документация
```

**Технологии:**
- Backend: Node.js, Express, Socket.io, Redis
- Frontend: React, Vite, Socket.io Client
- UI: CSS3, Telegram WebApp API

**Возможности:**
- ✅ 2-6 игроков одновременно
- ✅ Реалтайм через WebSockets
- ✅ Адаптивный мобильный UI
- ✅ Хранение в Redis
- ✅ Интеграция с Telegram

## 📁 Структура файлов

```
.
├── combined-bot.js              # Основной бот
├── userbot-collector.js         # Userbot для сбора истории
├── collector-bot.js             # Альтернативный коллектор
├── index.js                     # Простой бот (legacy)
│
├── game21/                      # Игра 21 Очко
│   ├── server/                 # Backend
│   │   ├── server.js
│   │   ├── gameManager.js
│   │   └── package.json
│   ├── client/                 # Frontend
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── components/
│   │   │   └── utils/
│   │   ├── index.html
│   │   └── package.json
│   ├── check-setup.js          # Скрипт проверки
│   ├── README.md               # Документация
│   ├── QUICK-START.md          # Быстрый старт
│   ├── EXAMPLES.md             # Примеры
│   ├── CHEATSHEET.md           # Шпаргалка
│   └── FAQ.md                  # FAQ
│
├── README.md                    # Главный README
├── README-COMBINED.md           # Документация бота
├── README-GAME21.md             # Краткое описание игры
├── GAME21-SETUP.md              # Настройка игры
├── PROJECT-INFO.md              # Этот файл
├── USERBOT-SETUP.md             # Настройка userbot
│
├── .env                         # Переменные окружения
├── .env.example                 # Пример .env
├── package.json                 # Зависимости проекта
└── messages.txt                 # Собранные сообщения
```

## 🔧 Конфигурация

### Переменные окружения

**Корневой .env:**
```env
# Бот
BOT_TOKEN=                    # Токен основного бота
GROQ_API_KEY=                 # API ключ Groq
COLLECTOR_BOT_TOKEN=          # Токен бота-коллектора (опционально)

# Userbot
TELEGRAM_API_ID=              # API ID от my.telegram.org
TELEGRAM_API_HASH=            # API Hash
TELEGRAM_SESSION=             # Сессия (генерируется)

# Настройки
TARGET_CHAT_ID=               # ID целевого чата
MESSAGE_LIMIT=150             # Лимит сообщений

# Игра
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

**game21/server/.env:**
```env
PORT=3001
REDIS_URL=redis://localhost:6379
WEBAPP_URL=http://localhost:5173
```

**game21/client/.env:**
```env
VITE_SOCKET_URL=http://localhost:3001
```

## 🚀 Команды

### Установка
```bash
npm install              # Зависимости бота
npm run game:install     # Зависимости игры
```

### Запуск
```bash
npm run combined         # Основной бот
npm run userbot          # Настройка userbot
npm run game:dev         # Игра (dev режим)
npm run game:server      # Только backend игры
npm run game:client      # Только frontend игры
```

### Разработка
```bash
npm run combined:dev     # Бот с автоперезагрузкой
npm run game:dev         # Игра с hot reload
```

### Проверка
```bash
cd game21
npm run check           # Проверка настройки игры
```

## 📊 Статистика проекта

### Размер кода
- **Бот:** ~1000 строк JavaScript
- **Игра Backend:** ~300 строк JavaScript
- **Игра Frontend:** ~500 строк React/JSX
- **Стили:** ~400 строк CSS
- **Документация:** ~3000 строк Markdown

### Файлы
- Код: 15+ файлов
- Документация: 12+ файлов
- Конфигурация: 5+ файлов

### Зависимости
- Бот: 6 npm пакетов
- Игра: 10+ npm пакетов

## 🎯 Использование

### Для пользователей

1. **Добавь бота в группу**
2. **Используй команды:**
   - `/summarize` - Суммаризация
   - `/opros` - Опрос
   - `/game21` - Игра

### Для разработчиков

1. **Клонируй репозиторий**
2. **Настрой .env файлы**
3. **Установи зависимости**
4. **Запусти Redis**
5. **Запусти бота и игру**

## 🔄 Workflow

### Разработка
```
1. Изменения в коде
2. Тестирование локально
3. Проверка в Telegram
4. Commit & Push
5. Деплой
```

### Деплой
```
1. Backend игры → Railway
2. Frontend игры → Vercel
3. Redis → Upstash
4. Бот → VPS/Railway
5. Обновить .env
6. Перезапустить
```

## 📈 Производительность

### Бот
- Обрабатывает сообщения в реальном времени
- Лимит токенов: 7000 для контекста
- Хранит до 500 последних сообщений в памяти

### Игра
- Поддерживает множество одновременных игр
- Состояние хранится в Redis (TTL: 1 час)
- WebSocket для реалтайм обновлений
- Оптимизирован для мобильных устройств

## 🔒 Безопасность

### Реализовано
- ✅ Проверка владельца бота
- ✅ Валидация команд
- ✅ Ограничение доступа к приватным командам
- ✅ HTTPS для WebApp (в продакшне)

### Рекомендуется добавить
- ⚠️ Rate limiting
- ⚠️ Аутентификация игроков
- ⚠️ Валидация данных на сервере
- ⚠️ Защита от DDoS

## 🐛 Известные проблемы

### Бот
- Нет - всё работает стабильно

### Игра
- Нет ограничения по времени на ход
- Клиент видит все карты (можно читерить)
- Нет переподключения при разрыве соединения

## 🎯 Roadmap

### Ближайшие планы
- [ ] Добавить ставки в игру
- [ ] Статистика игроков
- [ ] Звуковые эффекты
- [ ] Анимации карт
- [ ] Чат в игре

### Долгосрочные планы
- [ ] Веб-панель управления ботом
- [ ] Больше игр (покер, дурак)
- [ ] Турниры
- [ ] Рейтинговая система
- [ ] Мультиязычность

## 📚 Документация

### Основная
- [README.md](README.md) - Главная страница
- [README-COMBINED.md](README-COMBINED.md) - Документация бота
- [README-GAME21.md](README-GAME21.md) - Описание игры

### Игра
- [game21/README.md](game21/README.md) - Полная документация
- [game21/QUICK-START.md](game21/QUICK-START.md) - Быстрый старт
- [game21/EXAMPLES.md](game21/EXAMPLES.md) - Примеры
- [game21/CHEATSHEET.md](game21/CHEATSHEET.md) - Шпаргалка
- [game21/FAQ.md](game21/FAQ.md) - Частые вопросы

### Настройка
- [GAME21-SETUP.md](GAME21-SETUP.md) - Настройка игры
- [USERBOT-SETUP.md](USERBOT-SETUP.md) - Настройка userbot

## 🤝 Вклад

Проект открыт для вклада! Можешь:
- Сообщить о баге
- Предложить улучшение
- Добавить новую функцию
- Улучшить документацию

## 📄 Лицензия

MIT License - используй как хочешь!

## 👨‍💻 Контакты

Создано для combined-bot 🤖

---

**Версия:** 1.0.0  
**Дата:** 2026-02-07  
**Статус:** ✅ Стабильная версия

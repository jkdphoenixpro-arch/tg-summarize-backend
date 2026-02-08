# 👋 Читай это первым!

## Что это?

Telegram бот с игрой в 21 очко (Blackjack) для 2-6 игроков.

---

## 🚀 Быстрый старт (5 минут)

### 1. Установка

```bash
setup.bat
```

### 2. Настройка

Создай 3 файла `.env` (см. [QUICK-SETUP.md](QUICK-SETUP.md))

### 3. Запуск

```bash
start-all.bat
```

### 4. Проверка

- Игра: http://localhost:5173?gameId=test
- Бот: `/game21` в Telegram

---

## 📚 Документация

### Начни здесь:
- **[QUICK-SETUP.md](QUICK-SETUP.md)** ⭐ - Быстрая настройка (5 минут)
- **[HOW-TO-RUN.md](HOW-TO-RUN.md)** ⭐ - Как запустить
- [START-HERE.md](START-HERE.md) - Подробный гайд

### Если проблемы:
- [game21/FAQ.md](game21/FAQ.md) - 40+ вопросов
- [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md) - Про Redis

### Полная документация:
- [README.md](README.md) - Главная страница
- [DOCS-INDEX.md](DOCS-INDEX.md) - Все документы

---

## ⚠️ Важно

### Нужны 3 терминала:
1. Backend (game21/server)
2. Frontend (game21/client)
3. Bot (combined-bot.js)

### Или просто запусти:
```bash
start-all.bat
```

---

## 🎮 Использование

### В Telegram группе:

```
/game21
```

Появится кнопка "🎮 Играть" - нажми и играй!

---

## 🐛 Проблемы?

### Ошибка "Only HTTPS links allowed"

Telegram WebApp требует HTTPS. Используй ngrok:

📖 **[FIX-HTTPS-ISSUE.md](FIX-HTTPS-ISSUE.md)** ⭐ - Решение проблемы

### Ошибка установки
```bash
npm cache clean --force
setup.bat
```

### Порт занят
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Бот не работает
1. Проверь `.env` файлы
2. Проверь что все 3 терминала запущены
3. Смотри логи в терминалах

---

## ✅ Чеклист

- [ ] Запустил `setup.bat`
- [ ] Создал 3 `.env` файла
- [ ] Запустил `start-all.bat`
- [ ] Игра открывается в браузере
- [ ] Бот отвечает в Telegram
- [ ] Команда `/game21` работает

---

**Всё готово!** Играй и наслаждайся! 🎴

📖 Подробнее: [QUICK-SETUP.md](QUICK-SETUP.md)

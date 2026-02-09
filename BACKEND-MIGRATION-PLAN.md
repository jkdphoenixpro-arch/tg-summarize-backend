# 🔄 План миграции бэкенда на облако

## 🐛 Проблема

Команды `/summarize` и `/opros` сохраняют сообщения в файл `messages.txt`:
```javascript
fs.writeFileSync('messages.txt', fileContent, 'utf-8');
```

**Почему это проблема:**
- ❌ На Render/Railway файловая система **эфемерная** (временная)
- ❌ При перезапуске контейнера файлы удаляются
- ❌ Нельзя масштабировать на несколько инстансов
- ❌ Нет резервного копирования

---

## ✅ Решение: Использовать MongoDB

У тебя уже есть MongoDB для игры! Просто добавим коллекцию для сообщений.

---

## 📋 План миграции

### Вариант 1: Хранить в памяти (простой, но временный)

**Плюсы:**
- ✅ Не нужно менять код
- ✅ Работает на облаке
- ✅ Быстро

**Минусы:**
- ❌ Данные теряются при перезапуске
- ❌ Не подходит для production

**Реализация:**
```javascript
// Уже есть в коде!
const chatMessages = new Map();
chatMessages.set(chatId, messages);
```

**Что убрать:**
```javascript
// Удалить все fs.writeFileSync
// fs.writeFileSync('messages.txt', fileContent, 'utf-8');
```

---

### Вариант 2: Хранить в MongoDB (рекомендуется)

**Плюсы:**
- ✅ Данные сохраняются навсегда
- ✅ Можно делать аналитику
- ✅ Масштабируемо
- ✅ Резервное копирование

**Минусы:**
- ⚠️ Нужно немного изменить код

---

## 🚀 Реализация MongoDB решения

### Шаг 1: Создать модель для сообщений

Создать файл `models/ChatMessage.js`:

```javascript
import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Индекс для быстрого поиска последних сообщений
chatMessageSchema.index({ chatId: 1, timestamp: -1 });

// TTL индекс - автоматически удалять сообщения старше 30 дней
chatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('ChatMessage', chatMessageSchema);
```

### Шаг 2: Обновить функцию summarize

**Было:**
```javascript
// Сохраняем в файл
fs.writeFileSync('messages.txt', fileContent, 'utf-8');

// Сохраняем в память
chatMessages.set(chatId, messages);
```

**Стало:**
```javascript
import ChatMessage from './models/ChatMessage.js';

// Сохраняем в MongoDB
await ChatMessage.insertMany(
  messages.map(msg => ({
    chatId: chatId.toString(),
    username: msg.username,
    text: msg.text
  }))
);

console.log(`💾 Сохранено ${messages.length} сообщений в MongoDB`);
```

### Шаг 3: Получение сообщений из MongoDB

```javascript
// Получить последние N сообщений
const messages = await ChatMessage
  .find({ chatId: chatId.toString() })
  .sort({ timestamp: -1 })
  .limit(150)
  .lean();

// Переворачиваем (от старых к новым)
messages.reverse();
```

---

## 🎯 Минимальные изменения (рекомендую)

### Вариант 3: Гибридный подход

**Для production (облако):**
- Использовать только `chatMessages.set()` (память)
- Убрать все `fs.writeFileSync()`

**Для development (локально):**
- Оставить `fs.writeFileSync()` для отладки

**Реализация:**
```javascript
// Сохраняем в память (всегда)
chatMessages.set(chatId, messages);

// Сохраняем в файл только локально
if (process.env.NODE_ENV !== 'production') {
  fs.writeFileSync('messages.txt', fileContent, 'utf-8');
  console.log('💾 Сохранено в messages.txt (dev mode)');
}
```

---

## 📝 Что нужно изменить в коде

### 1. Удалить все `fs.writeFileSync` для messages.txt

**Файлы для изменения:**
- `combined-bot.js` (6 мест)
- `userbot-collector.js` (1 место)
- `collector-bot.js` (1 место)

**Найти и заменить:**
```javascript
// УДАЛИТЬ:
fs.writeFileSync('messages.txt', fileContent, 'utf-8');
console.log('💾 Сохранено в messages.txt');

// ЗАМЕНИТЬ НА:
// Сообщения уже в памяти через chatMessages.set()
console.log('💾 Сообщения сохранены в памяти');
```

### 2. Обновить .gitignore

```
messages.txt
messages_*.txt
history_*.txt
```

Уже есть! ✅

---

## 🧪 Тестирование

### Локально (с файлами):
```bash
# Оставить как есть
npm start
```

### На облаке (без файлов):
```bash
# Установить переменную окружения
NODE_ENV=production

# Файлы не будут создаваться
```

---

## 🎯 Рекомендация

**Для быстрого деплоя:**

1. **Убрать все `fs.writeFileSync` для messages.txt**
2. **Оставить только `chatMessages.set()`** (память)
3. **Задеплоить на Render/Railway**

**Плюсы:**
- ✅ Минимальные изменения
- ✅ Работает на облаке
- ✅ Быстро реализовать

**Минусы:**
- ⚠️ Данные теряются при перезапуске (но для summarize это нормально)

---

## 🔧 Альтернативы

### 1. Redis (для кэша)
```javascript
await redis.set(`messages:${chatId}`, JSON.stringify(messages), 'EX', 3600);
```

### 2. MongoDB (для постоянного хранения)
```javascript
await ChatMessage.insertMany(messages);
```

### 3. Только память (самое простое)
```javascript
chatMessages.set(chatId, messages);
```

---

## 💡 Мой совет

**Для твоего случая лучше всего:**

1. **Убрать `fs.writeFileSync`** - не работает на облаке
2. **Оставить `chatMessages.set()`** - уже есть в коде
3. **Добавить очистку старых данных:**

```javascript
// Очищать память каждый час
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [chatId, data] of chatMessages.entries()) {
    if (data.timestamp < oneHourAgo) {
      chatMessages.delete(chatId);
      console.log(`🧹 Очищена память для чата ${chatId}`);
    }
  }
}, 3600000);
```

---

## 📋 Чеклист миграции

- [ ] Удалить все `fs.writeFileSync('messages.txt', ...)`
- [ ] Оставить `chatMessages.set(chatId, messages)`
- [ ] Добавить `NODE_ENV=production` на облаке
- [ ] Протестировать локально
- [ ] Задеплоить на Render/Railway
- [ ] Проверить `/summarize` и `/opros` в production

---

Хочешь, помогу убрать все `fs.writeFileSync` из кода?

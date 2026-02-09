# Звуковые эффекты в игре 🔊

## Что сделано

Создана инфраструктура для звуковых эффектов в игре блекджек.

## Структура

```
game21/client/
├── public/
│   └── sounds/              ← Папка для звуковых файлов
│       ├── README.md        ← Инструкции какие звуки нужны
│       ├── card-deal.mp3    ← Добавь звук раздачи карты
│       ├── hit.mp3          ← Добавь звук взятия карты
│       ├── stand.mp3        ← Добавь звук паса
│       ├── win.mp3          ← Добавь звук победы
│       ├── lose.mp3         ← Добавь звук проигрыша
│       └── timeout.mp3      ← Добавь звук таймаута (опционально)
└── src/
    └── utils/
        └── sounds.js        ← Утилита для работы со звуками
```

## Звуковые эффекты

| Звук | Файл | Когда воспроизводится |
|------|------|----------------------|
| 🃏 Раздача карты | `card-deal.mp3` | При раздаче карт в начале игры |
| 🎯 Взять карту | `hit.mp3` | Когда игрок нажимает "Взять карту" |
| ✋ Пас | `stand.mp3` | Когда игрок нажимает "Пас" |
| 🎉 Победа | `win.mp3` | Когда игрок выигрывает |
| 😔 Проигрыш | `lose.mp3` | Когда игрок проигрывает |
| ⏰ Таймаут | `timeout.mp3` | Когда истекает время хода |

## Использование в коде

### Импорт
```javascript
import soundManager, { playSound } from '../utils/sounds';
```

### Воспроизведение звука
```javascript
// Простой способ
playSound('hit');
playSound('win');

// Или через менеджер
soundManager.play('cardDeal');
```

### Управление звуками
```javascript
// Включить/выключить звуки
soundManager.toggle();

// Установить громкость (0.0 - 1.0)
soundManager.setVolume(0.7);

// Включить звуки
soundManager.setEnabled(true);

// Выключить звуки
soundManager.setEnabled(false);
```

## Интеграция в Game.jsx

### Пример добавления звуков:

```javascript
import { playSound } from '../utils/sounds';

// При взятии карты
const handleHit = () => {
  playSound('hit');
  hapticFeedback('light');
  socket.emit('hit', { gameId, userId: user.userId });
};

// При пасе
const handleStand = () => {
  playSound('stand');
  hapticFeedback('medium');
  socket.emit('stand', { gameId, userId: user.userId });
};

// При победе/проигрыше
useEffect(() => {
  if (isFinished && myPlayer?.result) {
    if (myPlayer.result === 'win') {
      playSound('win');
    } else if (myPlayer.result === 'lose') {
      playSound('lose');
    }
  }
}, [isFinished, myPlayer?.result]);

// При раздаче карт
useEffect(() => {
  if (gameState?.status === 'playing' && myPlayer?.cards?.length === 2) {
    playSound('cardDeal');
  }
}, [gameState?.status, myPlayer?.cards?.length]);

// При таймауте
useEffect(() => {
  const handleTimeout = ({ userId }) => {
    if (userId === user.userId) {
      playSound('timeout');
      setShowTimeoutMessage(true);
      setTimeout(() => setShowTimeoutMessage(false), 3000);
    }
  };

  socket.on('turn_timeout', handleTimeout);
  return () => socket.off('turn_timeout', handleTimeout);
}, [socket, user]);
```

## Настройки звука (UI)

Можно добавить кнопку управления звуком в интерфейс:

```javascript
import { useState } from 'react';
import soundManager from '../utils/sounds';

function SoundToggle() {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  return (
    <button onClick={toggleSound} className="sound-toggle">
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  );
}
```

## Особенности

### Автоматическое сохранение настроек
Настройки звука сохраняются в `localStorage`:
- Громкость
- Включен/выключен звук

### Обработка ошибок
Если звуковой файл не найден, в консоли появится предупреждение, но игра продолжит работать.

### Telegram WebApp
Звуки работают в Telegram WebApp, но требуют взаимодействия пользователя (клик) перед первым воспроизведением.

## Где найти звуки

### Бесплатные источники:
1. **Freesound.org** - https://freesound.org/
2. **Zapsplat** - https://www.zapsplat.com/
3. **Mixkit** - https://mixkit.co/free-sound-effects/
4. **Pixabay** - https://pixabay.com/sound-effects/

### Рекомендуемые параметры:
- Формат: MP3
- Битрейт: 128-192 kbps
- Размер: < 50 KB на файл
- Длительность: 0.3-2 секунды

## Следующие шаги

1. ✅ Папка создана: `game21/client/public/sounds/`
2. ✅ Утилита создана: `game21/client/src/utils/sounds.js`
3. ⏳ **Добавь звуковые файлы** в папку `sounds/`
4. ⏳ **Интегрируй звуки** в `Game.jsx` (см. примеры выше)
5. ⏳ **Протестируй** звуки в игре
6. ⏳ **Настрой громкость** если нужно

## Тестирование

После добавления файлов:
```bash
cd game21/client
npm run dev
```

Проверь:
- ✅ Звуки воспроизводятся при действиях
- ✅ Громкость комфортная
- ✅ Нет задержек
- ✅ Звуки не перекрывают друг друга

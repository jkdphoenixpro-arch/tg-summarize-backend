import EventEmitter from 'events';

// Создаем глобальный EventEmitter для связи между ботом и игровым сервером
export const botEvents = new EventEmitter();

// Увеличиваем лимит слушателей (по умолчанию 10)
botEvents.setMaxListeners(20);

console.log('✅ BotEvents инициализирован');

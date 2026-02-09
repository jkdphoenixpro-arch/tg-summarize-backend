import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '');

console.log('🤖 Запуск Userbot для сбора истории сообщений...\n');

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

async function main() {
    await client.start({
        phoneNumber: async () => await input.text('Введи номер телефона: '),
        password: async () => await input.text('Введи пароль 2FA (если есть): '),
        phoneCode: async () => await input.text('Введи код из Telegram: '),
        onError: (err) => console.log(err),
    });

    console.log('✅ Успешно подключен!');
    console.log('📝 Сохрани эту сессию в .env:');
    console.log(`TELEGRAM_SESSION=${client.session.save()}\n`);

    // ID чата из которого нужно собрать сообщения
    const chatId = process.env.TARGET_CHAT_ID || await input.text('Введи ID чата (например -1002438653104): ');
    const limit = parseInt(process.env.MESSAGE_LIMIT || '100');

    console.log(`\n📥 Собираю последние ${limit} сообщений из чата ${chatId}...`);

    try {
        const messages = [];
        let offsetId = 0;

        // Получаем сообщения порциями
        for await (const message of client.iterMessages(chatId, { limit })) {
            if (message.text) {
                messages.push({
                    id: message.id,
                    date: new Date(message.date * 1000).toLocaleString('ru-RU'),
                    username: message.sender?.username || message.sender?.firstName || 'Unknown',
                    text: message.text
                });
                
                if (messages.length % 10 === 0) {
                    console.log(`📊 Собрано ${messages.length} сообщений...`);
                }
            }
        }

        console.log(`\n✅ Собрано ${messages.length} сообщений`);

        // Формируем содержимое файла в формате для нейросети
        const content = messages.reverse().map((msg) => {
            return `${msg.username}: ${msg.text}`;
        }).join('\n');

        console.log(`💾 Собрано ${messages.length} сообщений в памяти`);
        console.log(`📊 Формат: username: текст (по одному сообщению на строку)`);

    } catch (error) {
        console.error('❌ Ошибка при сборе сообщений:', error);
    }
}

main().catch(console.error);

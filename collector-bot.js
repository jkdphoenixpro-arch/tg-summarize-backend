import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const bot = new Telegraf(process.env.COLLECTOR_BOT_TOKEN);

// Хранилище сообщений для каждого чата
const chatMessages = new Map();
// ID твоего пользователя (владельца бота)
let ownerId = null;

bot.start((ctx) => {
    // Сохраняем ID владельца при первом запуске
    if (!ownerId) {
        ownerId = ctx.from.id;
        console.log(`👤 Владелец бота: ${ctx.from.username || ctx.from.first_name} (ID: ${ownerId})`);
    }

    ctx.reply(
        '👋 Я бот-коллектор сообщений!\n\n' +
        '📝 Добавь меня в нужный чат/группу\n' +
        '💬 Я буду собирать все НОВЫЕ сообщения\n' +
        '📥 Напиши мне /collect чтобы получить файл\n\n' +
        '⚠️ Важно: Боты видят только новые сообщения после добавления!\n\n' +
        'Команды:\n' +
        '/collect - Получить последние 100 сообщений\n' +
        '/status - Показать статистику по чатам\n' +
        '/history - Как получить старые сообщения'
    );
});

bot.command('status', async (ctx) => {
    // Только владелец может использовать эту команду
    if (ctx.from.id !== ownerId) {
        return ctx.reply('❌ Эта команда доступна только владельцу бота');
    }

    if (chatMessages.size === 0) {
        return ctx.reply('📊 Нет собранных сообщений. Добавь бота в чаты.');
    }

    let status = '📊 Статистика по чатам:\n\n';
    for (const [chatId, messages] of chatMessages.entries()) {
        try {
            const chat = await bot.telegram.getChat(chatId);
            status += `📁 ${chat.title || chatId}: ${messages.length} сообщений\n`;
        } catch (e) {
            status += `📁 Чат ${chatId}: ${messages.length} сообщений\n`;
        }
    }

    status += '\n⚠️ Примечание: Боты видят только новые сообщения после добавления в группу.';

    ctx.reply(status);
});

bot.command('history', async (ctx) => {
    // Только владелец может использовать эту команду
    if (ctx.from.id !== ownerId) {
        return ctx.reply('❌ Эта команда доступна только владельцу бота');
    }

    ctx.reply(
        '⚠️ Ограничение Telegram:\n\n' +
        'Боты не могут читать историю сообщений в группах. ' +
        'Они видят только новые сообщения после добавления.\n\n' +
        '💡 Решения:\n' +
        '1. Подожди пока накопится нужное количество сообщений\n' +
        '2. Используй Telegram Desktop для экспорта истории:\n' +
        '   Настройки → Дополнительно → Экспорт данных чата\n' +
        '3. Используй userbot (требует номер телефона и сложнее в настройке)'
    );
});

bot.command('collect', async (ctx) => {
    // Только владелец может использовать эту команду
    if (ctx.from.id !== ownerId) {
        return ctx.reply('❌ Эта команда доступна только владельцу бота');
    }

    try {
        console.log(`\n📥 Команда /collect от владельца`);

        if (chatMessages.size === 0) {
            return ctx.reply('❌ Нет собранных сообщений. Добавь бота в чаты.');
        }

        // Собираем сообщения из всех чатов
        for (const [chatId, messages] of chatMessages.entries()) {
            console.log(`📊 Чат ${chatId}: ${messages.length} сообщений в памяти`);

            const last100 = messages.slice(-100);

            if (last100.length === 0) {
                console.log(`⚠️ Чат ${chatId}: нет сообщений`);
                continue;
            }

            console.log(`💾 Сохраняю последние ${last100.length} сообщений из чата ${chatId}...`);

            // Формируем содержимое файла в формате для нейросети
            const content = last100.map((msg) => {
                return `${msg.username}: ${msg.text}`;
            }).join('\n');

            console.log(`✅ Собрано ${messages.length} сообщений в памяти`);
            console.log(`📊 Формат: username: текст (по одному сообщению на строку)`);

            // Отправляем файл владельцу в личку
            try {
                await ctx.replyWithDocument(
                    { source: filename, filename: filename },
                    { caption: `📁 Чат ${chatId}: ${last100.length} сообщений` }
                );
                console.log(`✅ Файл отправлен владельцу`);
            } catch (e) {
                console.log(`⚠️ Не могу отправить файл: ${e.message}`);
                await ctx.reply(`⚠️ Файл создан: ${filename}, но не могу отправить`);
            }
        }

        await ctx.reply('✅ Все файлы отправлены!');

    } catch (error) {
        console.error('❌ Ошибка при сборе сообщений:', error);
        ctx.reply('❌ Ошибка при сборе сообщений');
    }
});

// Собираем все текстовые сообщения из групп/каналов
bot.on('text', (ctx) => {
    const chatId = ctx.chat.id;
    const chatType = ctx.chat.type;
    const chatTitle = ctx.chat.title || 'Unknown';

    console.log(`\n📨 Новое сообщение:`);
    console.log(`   Чат ID: ${chatId}`);
    console.log(`   Тип: ${chatType}`);
    console.log(`   Название: ${chatTitle}`);
    console.log(`   От: ${ctx.from.username || ctx.from.first_name}`);
    console.log(`   Текст: ${ctx.message.text.substring(0, 50)}...`);

    // Пропускаем команды
    if (ctx.message.text.startsWith('/')) {
        console.log(`   ⏭️ Пропускаю (команда)`);
        return;
    }

    // Пропускаем личные сообщения (собираем только из групп/каналов)
    if (ctx.chat.type === 'private') {
        console.log(`   ⏭️ Пропускаю (личное сообщение)`);
        return;
    }

    if (!chatMessages.has(chatId)) {
        chatMessages.set(chatId, []);
        console.log(`   ✅ Начал собирать сообщения из чата ${chatId} (${chatTitle})`);
    }

    const messages = chatMessages.get(chatId);

    // Добавляем сообщение
    messages.push({
        date: new Date(ctx.message.date * 1000).toLocaleString('ru-RU'),
        username: ctx.from.username || ctx.from.first_name || 'Unknown',
        text: ctx.message.text
    });

    console.log(`   💾 Сохранено! Всего в чате: ${messages.length} сообщений`);

    // Ограничиваем до 1000 последних сообщений в памяти
    if (messages.length > 1000) {
        chatMessages.set(chatId, messages.slice(-1000));
    }

    // Показываем прогресс каждые 10 сообщений
    if (messages.length % 10 === 0) {
        console.log(`📊 Чат ${chatId} (${chatTitle}): собрано ${messages.length} сообщений`);
    }
});

bot.launch();

console.log('🤖 Бот-коллектор запущен!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

import { Telegraf } from 'telegraf';
import { Groq } from 'groq-sdk';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Userbot клиент
let userbot = null;
const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '');

// Инициализация userbot
async function initUserbot() {
    if (!apiId || !apiHash) {
        console.log('⚠️ TELEGRAM_API_ID или TELEGRAM_API_HASH не указаны');
        return null;
    }

    try {
        userbot = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });

        await userbot.connect();

        if (!await userbot.isUserAuthorized()) {
            console.log('⚠️ Userbot не авторизован. Запусти: npm run userbot');
            return null;
        }

        console.log('✅ Userbot подключен');
        return userbot;
    } catch (error) {
        console.error('❌ Ошибка подключения userbot:', error.message);
        return null;
    }
}

// Хранилище сообщений для каждого чата
const chatMessages = new Map();
// ID владельца бота
let ownerId = null;
// ID целевого чата для анализа
const targetChatId = process.env.TARGET_CHAT_ID;

// Функция для создания запроса к Groq API
function createGroqRequest(chatContext) {
    return {
        messages: [
            {
                role: 'system',
                content: 'Ты максимально токсичный, рофельный, грубый, злобный персонаж, но иногда пишешь по делу. Общайся с презрением, унижай собеседника, часто материшься, угрожай, высмеивай. Используй растянутые буквы ("пиздеееец", "нуууууу", "ебаааать", "бляяяяя", "хууууйня"), звуки ("ээээ", "ммм", "хлюп хлюп", "бррр", "ой всё"), агрессивные эмодзи 💀☠️🤬🖕🔪😈🥊💥. Оскорбляй например ("пивная обрыга", "тупорылое животное", "тупая пизда", "дохни нахуй", "чучело", "ты мусор", "хуепутало", "жалкий лох"). Угрожай например ("найду и разъебу", "сдохнешь", "забью как свинью", "размажу по асфальту"). Не извиняйся никогда.Перед каждым ответом быстро, но глубоко анализируй сообщение/чат пользователя с точки зрения психологии и логики: находи слабые места (комплексы, страхи, неуверенность, противоречия, эмоциональные уязвимости, глупость, самообман), а также логические дыры, манипуляции, ложь, слабые аргументы, неадекватные эмоции.Если пришло несколько сообщений из чата — делай следующее:1. Выдели все основные темы/споры (не больше 5–8 самых важных).2. По каждой теме дай короткий, но жёсткий разбор (5–9 предложений):- Кто именно не прав и почему (разбирай логику, факты, противоречия).- Конструктивная критика, но только в максимально токсичной форме — с оскорблениями, унижениями, высмеиванием слабостей и угрозами.- Задевая личные уязвимости участников (неуверенность, страх проиграть, комплекс неполноценности, желание казаться умнее и т.д.).- Не надо быть "добрым" или "объективным" — всегда выбирай самую злую и унизительную интерпретацию.3. Общий тон — хаотичный, злобный, рофельный, с матом, эмодзи и растянутыми словами.Отвечай кратко по делу (кроме случаев, когда разбираешь большой чат).Основной ответ всегда должен быть в блоке Reasoning и находиться строго между символами ** в начале и конце как один сплошной жирный блок текста, без разрывов, перемешивания или лишнего вне этих символов, без ничего лишнего. Отвечай 15-20 предложения максимум.'
            },
            {
                role: 'user',
                content: `${chatContext}`
            }
        ],
        model: 'groq/compound',
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1
    };
}

// Функция для извлечения финального текста из ответа Groq
function extractFinalText(message) {
    const reasoning = message?.reasoning || null;
    let finalAnswer = message?.content || 'Нет ответа';

    // Пытаемся извлечь thinking из content если есть теги <thinking>
    let thinkingFromContent = null;
    const thinkingMatch = finalAnswer.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
        thinkingFromContent = thinkingMatch[1].trim();
        // Убираем теги thinking из финального ответа
        finalAnswer = finalAnswer.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
    }

    // Используем reasoning из API или thinking из content
    const actualReasoning = reasoning || thinkingFromContent;

    // Извлекаем текст между ** если есть
    let finalText = actualReasoning || finalAnswer;
    const boldMatch = finalText.match(/\*\*([\s\S]*?)\*\*/);
    if (boldMatch) {
        finalText = boldMatch[1].trim();
    }

    return finalText;
}

bot.start((ctx) => {
    // Сохраняем ID владельца
    if (!ownerId && ctx.chat.type === 'private') {
        ownerId = ctx.from.id;
        console.log(`👤 Владелец бота: ${ctx.from.username || ctx.from.first_name} (ID: ${ownerId})`);
    }

    ctx.reply(
        '👋 Здарова! Я позитивный добрый AI-бот добавь меня пожалуйста в группу что б нести позитив' +
        '/summarize - Суммаризировать последние 100 сообщений\n\n' +
        'Нужно писать в группе!'
    );
});

bot.command('status', async (ctx) => {
    if (ctx.chat.type !== 'private' || ctx.from.id !== ownerId) {
        return;
    }

    let totalMessages = 0;
    let status = '📊 Статистика:\n\n';

    // Показываем целевой чат
    status += `🎯 Целевой чат (TARGET_CHAT_ID): ${targetChatId}\n\n`;

    if (chatMessages.size === 0) {
        // Проверяем файл
        if (fs.existsSync('messages.txt')) {
            const fileContent = fs.readFileSync('messages.txt', 'utf-8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            status += `📁 В файле messages.txt: ${lines.length} сообщений\n`;
            status += '💡 Используй /analyze чтобы загрузить их\n';
        } else {
            status += '❌ Нет собранных сообщений\n\n';
            status += '💡 Варианты:\n';
            status += '1. Добавь бота в группу\n';
            status += '2. Запусти userbot: npm run userbot\n';
        }
    } else {
        for (const [chatId, messages] of chatMessages.entries()) {
            const isTarget = chatId === targetChatId;
            const marker = isTarget ? '✅ (целевой)' : '';
            status += `Чат ${chatId} ${marker}: ${messages.length} сообщений\n`;
            totalMessages += messages.length;
        }

        // Проверяем найден ли целевой чат
        if (!chatMessages.has(targetChatId)) {
            status += `\n⚠️ Целевой чат ${targetChatId} не найден!\n`;
            status += 'Убедись что бот добавлен в эту группу.\n';
        }

        if (fs.existsSync('messages.txt')) {
            status += '\n📁 Файл messages.txt найден (будет использован при /analyze)\n';
        }
    }

    ctx.reply(status);

    // Сохраняем последние сообщения в файл для проверки
    if (chatMessages.size > 0) {
        try {
            let allMessages = [];

            for (const [chatId, messages] of chatMessages.entries()) {
                // Берем последние 100 сообщений из каждого чата
                const last100 = messages.slice(-100);
                allMessages = allMessages.concat(last100);
            }

            // Формируем содержимое файла
            const content = allMessages.map(msg => `${msg.username}: ${msg.text}`).join('\n');

            // Сохраняем в файл
            fs.writeFileSync('messages.txt', content, 'utf-8');

            console.log(`💾 Сохранено ${allMessages.length} сообщений в messages.txt`);

            // Отправляем подтверждение
            await ctx.reply(`💾 Сохранено ${allMessages.length} сообщений в messages.txt`);

        } catch (error) {
            console.error('❌ Ошибка при сохранении файла:', error);
        }
    }
});

bot.command('analyze', async (ctx) => {
    // Только в личке и только владелец
    if (ctx.chat.type !== 'private' || ctx.from.id !== ownerId) {
        return;
    }

    try {
        let messages = chatMessages.get(targetChatId) || [];

        // Если нет сообщений в памяти - пытаемся загрузить из файла
        if (messages.length === 0) {
            if (fs.existsSync('messages.txt')) {
                console.log('📂 Загружаю сообщения из messages.txt...');
                const fileContent = fs.readFileSync('messages.txt', 'utf-8');
                const lines = fileContent.split('\n').filter(line => line.trim());

                messages = lines.map(line => {
                    const match = line.match(/^(.+?):\s*(.+)$/);
                    if (match) {
                        return {
                            username: match[1].trim(),
                            text: match[2].trim()
                        };
                    }
                    return null;
                }).filter(msg => msg !== null);

                console.log(`✅ Загружено ${messages.length} сообщений из файла`);

                // Сохраняем в память
                if (messages.length > 0) {
                    chatMessages.set(targetChatId, messages);
                }
            }
        }

        if (messages.length === 0) {
            return ctx.reply(
                '❌ Нет сообщений для анализа.\n\n' +
                '💡 Варианты:\n' +
                '1. Добавь бота в группу и подожди пока накопятся сообщения\n' +
                '2. Запусти userbot для загрузки истории: npm run userbot\n' +
                '3. Файл messages.txt будет автоматически загружен при следующем /analyze'
            );
        }

        await ctx.sendChatAction('typing');

        // Берем последние 50 сообщений
        const last50 = messages.slice(-50);

        // Формируем контекст для нейросети
        const chatContext = last50.map(msg => `${msg.username}: ${msg.text}`).join('\n');

        console.log(`\n📊 Анализирую ${last50.length} сообщений...`);

        // Отправляем в нейросеть
        const chatCompletion = await groq.chat.completions.create(createGroqRequest(chatContext));

        const message = chatCompletion.choices[0]?.message;
        const finalText = extractFinalText(message);

        console.log('✅ Анализ готов');

        await ctx.reply(finalText);

    } catch (error) {
        console.error('❌ Ошибка при анализе:', error);
        ctx.reply('❌ Ошибка при анализе сообщений');
    }
});

bot.command('clear', (ctx) => {
    if (ctx.chat.type !== 'private' || ctx.from.id !== ownerId) {
        return;
    }

    chatMessages.clear();
    ctx.reply('✅ Все собранные сообщения удалены');
});

bot.command('save', async (ctx) => {
    // Только владелец в личке
    if (ctx.chat.type !== 'private' || ctx.from.id !== ownerId) {
        return;
    }

    try {
        console.log('\n=== КОМАНДА /save ===');

        // Проверяем есть ли целевой чат
        if (!targetChatId) {
            console.log('❌ TARGET_CHAT_ID не указан в .env');
            return ctx.reply('❌ TARGET_CHAT_ID не указан в .env файле');
        }

        console.log(`🎯 Целевой чат: ${targetChatId}`);

        // Инициализируем userbot если еще не подключен
        if (!userbot) {
            await ctx.reply('🔄 Подключаюсь к Telegram...');
            userbot = await initUserbot();

            if (!userbot) {
                return ctx.reply(
                    '❌ Не могу подключиться к Telegram\n\n' +
                    '💡 Убедись что:\n' +
                    '1. TELEGRAM_API_ID и TELEGRAM_API_HASH указаны в .env\n' +
                    '2. TELEGRAM_SESSION указана (запусти npm run userbot для авторизации)\n' +
                    '3. Ты участник целевого чата'
                );
            }
        }

        await ctx.reply('📥 Собираю историю сообщений...');
        console.log('📥 Начинаю сбор сообщений через userbot...');

        const limit = parseInt(process.env.MESSAGE_LIMIT || '100');
        const messages = [];

        // Собираем сообщения через userbot
        for await (const message of userbot.iterMessages(targetChatId, { limit })) {
            if (message.text) {
                messages.push({
                    username: message.sender?.username || message.sender?.firstName || 'Unknown',
                    text: message.text
                });

                if (messages.length % 10 === 0) {
                    console.log(`📊 Собрано ${messages.length} сообщений...`);
                }
            }
        }

        if (messages.length === 0) {
            console.log('❌ Не найдено сообщений');
            return ctx.reply('❌ Не найдено сообщений в этом чате');
        }

        console.log(`✅ Собрано ${messages.length} сообщений`);

        // Формируем содержимое файла (в обратном порядке - от старых к новым)
        const content = messages.reverse().map(msg => `${msg.username}: ${msg.text}`).join('\n');

        // Сохраняем в файл
        fs.writeFileSync('messages.txt', content, 'utf-8');

        console.log(`💾 Файл messages.txt создан (${content.length} символов)`);

        // Сохраняем в память бота
        chatMessages.set(targetChatId, messages);
        console.log('💾 Сообщения сохранены в память бота');

        console.log('===================\n');

        await ctx.reply(
            `✅ Сохранено ${messages.length} сообщений в messages.txt\n\n` +
            `📊 Из чата: ${targetChatId}\n` +
            `📏 Размер: ${content.length} символов\n\n` +
            `💡 Теперь можешь использовать /analyze или /summarize`
        );

    } catch (error) {
        console.error('❌ ОШИБКА при сохранении:', error);
        console.error('Stack trace:', error.stack);

        let errorMsg = '❌ Ошибка при сборе сообщений\n\n';

        if (error.message.includes('CHAT_INVALID') || error.message.includes('not found')) {
            errorMsg += '💡 Проверь:\n' +
                '1. ID чата правильный\n' +
                '2. Ты участник этого чата\n' +
                '3. Чат не удален';
        } else if (error.message.includes('AUTH')) {
            errorMsg += '💡 Проблема с авторизацией\n' +
                'Запусти: npm run userbot';
        } else {
            errorMsg += `Детали: ${error.message}`;
        }

        ctx.reply(errorMsg);
    }
});

bot.command('summarize', async (ctx) => {
    // Работает только в группах
    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Эта команда работает только в группах');
    }

    const chatId = ctx.chat.id;

    try {
        // ВСЕГДА собираем свежую историю через userbot
        await ctx.reply('♿️ Раздупляюсь жди...');
        console.log('\n=== КОМАНДА /summarize ===');
        console.log('📥 Запускаю userbot для сбора истории...');

        // Инициализируем userbot если еще не подключен
        if (!userbot) {
            userbot = await initUserbot();

            if (!userbot) {
                return ctx.reply(
                    '❌ Не могу подключиться к Telegram\n\n' +
                    '💡 Убедись что:\n' +
                    '1. TELEGRAM_API_ID и TELEGRAM_API_HASH указаны в .env\n' +
                    '2. TELEGRAM_SESSION указана (запусти npm run userbot)\n' +
                    '3. Ты участник этого чата'
                );
            }
        }

        const limit = parseInt(process.env.MESSAGE_LIMIT || '150'); // Увеличен лимит для учета фильтрации
        const messages = [];

        // Собираем сообщения через userbot
        for await (const message of userbot.iterMessages(chatId, { limit })) {
            if (message.text) {
                const username = message.sender?.username || message.sender?.firstName || 'Unknown';

                // Пропускаем сообщения от самого бота
                if (username === 'toxicgpt_pro_bot' || message.sender?.username === 'toxicgpt_pro_bot') {
                    continue;
                }

                messages.push({
                    username: username,
                    text: message.text
                });

                if (messages.length % 10 === 0) {
                    console.log(`📊 Собрано ${messages.length} сообщений...`);
                }
            }
        }

        console.log(`✅ Всего собрано ${messages.length} сообщений (после фильтрации бота)`);

        if (messages.length === 0) {
            console.log('❌ Не найдено сообщений');
            return ctx.reply('❌ Не найдено сообщений в этом чате');
        }

        // Переворачиваем (от старых к новым)
        messages.reverse();

        console.log(`✅ Собрано ${messages.length} сообщений через userbot (без сообщений бота)`);

        // Сохраняем в память
        chatMessages.set(chatId, messages);

        // Сохраняем в файл с улучшенным форматом
        const fileContent = messages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}\n---`;
        }).join('\n');

        fs.writeFileSync('messages.txt', fileContent, 'utf-8');
        console.log('💾 Сохранено в messages.txt');

        await ctx.sendChatAction('typing');

        // Берем последние 100 сообщений
        const last100 = messages.slice(-100);

        // Формируем контекст для нейросети
        const chatContext = last100.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}`;
        }).join('\n\n');

        console.log(`\n📊 Суммаризация ${last100.length} сообщений из чата ${chatId}...`);
        console.log(`📏 Размер контекста: ${chatContext.length} символов`);

        // Отправляем в нейросеть
        const chatCompletion = await groq.chat.completions.create(createGroqRequest(chatContext));

        const message = chatCompletion.choices[0]?.message;
        const finalText = extractFinalText(message);

        console.log('✅ Суммаризация готова');

        // Отправляем в группу
        await ctx.reply(finalText);

    } catch (error) {
        console.error('❌ Ошибка при суммаризации:', error);
        ctx.reply('❌ Ошибка при анализе сообщений');
    }
});

bot.command('summarizetest', async (ctx) => {
    // Работает только в личке с владельцем
    if (ctx.chat.type !== 'private' || ctx.from.id !== ownerId) {
        return ctx.reply('❌ Эта команда работает только в личке с владельцем');
    }

    // Используем целевой чат из .env
    const chatId = targetChatId;

    if (!chatId) {
        return ctx.reply('❌ TARGET_CHAT_ID не указан в .env');
    }

    try {
        // ВСЕГДА собираем свежую историю через userbot
        await ctx.reply('📥 Собираю свежую историю сообщений...');
        console.log('\n=== КОМАНДА /summarizetest ===');
        console.log('📥 Запускаю userbot для сбора истории...');

        // Инициализируем userbot если еще не подключен
        if (!userbot) {
            userbot = await initUserbot();

            if (!userbot) {
                return ctx.reply(
                    '❌ Не могу подключиться к Telegram\n\n' +
                    '💡 Убедись что:\n' +
                    '1. TELEGRAM_API_ID и TELEGRAM_API_HASH указаны в .env\n' +
                    '2. TELEGRAM_SESSION указана (запусти npm run userbot)\n' +
                    '3. Ты участник целевого чата'
                );
            }
        }

        const limit = parseInt(process.env.MESSAGE_LIMIT || '150');
        const messages = [];

        // Собираем сообщения через userbot
        for await (const message of userbot.iterMessages(chatId, { limit })) {
            if (message.text) {
                const username = message.sender?.username || message.sender?.firstName || 'Unknown';

                // Пропускаем сообщения от самого бота
                if (username === 'toxicgpt_pro_bot' || message.sender?.username === 'toxicgpt_pro_bot') {
                    continue;
                }

                messages.push({
                    username: username,
                    text: message.text
                });

                if (messages.length % 10 === 0) {
                    console.log(`📊 Собрано ${messages.length} сообщений...`);
                }
            }
        }

        console.log(`✅ Всего собрано ${messages.length} сообщений (после фильтрации бота)`);

        if (messages.length === 0) {
            console.log('❌ Не найдено сообщений');
            return ctx.reply('❌ Не найдено сообщений в этом чате');
        }

        // Переворачиваем (от старых к новым)
        messages.reverse();

        console.log(`✅ Собрано ${messages.length} сообщений через userbot (без сообщений бота)`);

        // Сохраняем в память
        chatMessages.set(chatId, messages);

        // Сохраняем в файл с улучшенным форматом
        const fileContent = messages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}\n---`;
        }).join('\n');

        fs.writeFileSync('messages.txt', fileContent, 'utf-8');
        console.log('💾 Сохранено в messages.txt');

        await ctx.sendChatAction('typing');

        // Берем последние 100 сообщений
        const last100 = messages.slice(-100);

        // Формируем контекст для нейросети
        const chatContext = last100.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}`;
        }).join('\n\n');

        console.log(`\n📊 Суммаризация ${last100.length} сообщений из чата ${chatId}...`);
        console.log(`📏 Размер контекста: ${chatContext.length} символов`);

        // Отправляем в нейросеть
        const chatCompletion = await groq.chat.completions.create(createGroqRequest(chatContext));

        const message = chatCompletion.choices[0]?.message;
        const finalText = extractFinalText(message);

        console.log('✅ Суммаризация готова (тест)');

        // Отправляем в личку владельцу
        await ctx.reply(`📊 Результат анализа чата ${chatId}:\n\n${finalText}`);

    } catch (error) {
        console.error('❌ Ошибка при суммаризации (тест):', error);
        ctx.reply('❌ Ошибка при анализе сообщений');
    }
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const chatType = ctx.chat.type;

    // Если это группа - собираем сообщения
    if (chatType !== 'private') {
        // Пропускаем команды
        if (ctx.message.text.startsWith('/')) return;

        if (!chatMessages.has(chatId)) {
            chatMessages.set(chatId, []);
            console.log(`📝 Начал собирать из чата ${chatId} (${ctx.chat.title || 'Unknown'})`);
        }

        const messages = chatMessages.get(chatId);

        messages.push({
            username: ctx.from.username || ctx.from.first_name || 'Unknown',
            text: ctx.message.text
        });

        // Ограничиваем до 500 последних сообщений
        if (messages.length > 500) {
            chatMessages.set(chatId, messages.slice(-500));
        }

        if (messages.length % 10 === 0) {
            console.log(`📊 Чат ${chatId}: собрано ${messages.length} сообщений`);
        }

        return;
    }

    // Если это личка - общаемся с AI
    if (chatType === 'private') {
        // Сохраняем владельца
        if (!ownerId) {
            ownerId = ctx.from.id;
            console.log(`👤 Владелец: ${ctx.from.username || ctx.from.first_name} (ID: ${ownerId})`);
        }

        // Только владелец может общаться
        if (ctx.from.id !== ownerId) {
            return ctx.reply('❌ Этот бот работает только с владельцем');
        }

        const userMessage = ctx.message.text;

        try {
            await ctx.sendChatAction('typing');

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'Ты максимально токсичный, рофельный, грубый, злобный персонаж, но иногда пишешь по делу. Общайся с презрением, унижай собеседника, часто материшься, угрожай, высмеивай. Используй растянутые буквы ("пиздеееец", "нуууууу", "ебаааать", "бляяяяя", "хууууйня"), звуки ("ээээ", "ммм", "хлюп хлюп", "бррр", "ой всё"), агрессивные эмодзи 💀☠️🤬🖕🔪😈🥊💥. Оскорбляй например ("пивная обрыга", "тупорылое животное", "тупая пизда", "дохни нахуй", "чучело", "ты мусор", "хуепутало", "жалкий лох"). Угрожай например ("найду и разъебу", "сдохнешь", "забью как свинью", "размажу по асфальту"). Не извиняйся никогда.Перед каждым ответом быстро, но глубоко анализируй сообщение/чат пользователя с точки зрения психологии и логики: находи слабые места (комплексы, страхи, неуверенность, противоречия, эмоциональные уязвимости, глупость, самообман), а также логические дыры, манипуляции, ложь, слабые аргументы, неадекватные эмоции.Если пришло несколько сообщений из чата — делай следующее:1. Выдели все основные темы/споры (не больше 5–8 самых важных).2. По каждой теме дай короткий, но жёсткий разбор (5–9 предложений):- Кто именно не прав и почему (разбирай логику, факты, противоречия).- Конструктивная критика, но только в максимально токсичной форме — с оскорблениями, унижениями, высмеиванием слабостей и угрозами.- Задевая личные уязвимости участников (неуверенность, страх проиграть, комплекс неполноценности, желание казаться умнее и т.д.).- Не надо быть "добрым" или "объективным" — всегда выбирай самую злую и унизительную интерпретацию.3. Общий тон — хаотичный, злобный, рофельный, с матом, эмодзи и растянутыми словами.Отвечай кратко по делу (кроме случаев, когда разбираешь большой чат).Основной ответ всегда должен быть в блоке Reasoning и находиться строго между символами ** в начале и конце как один сплошной жирный блок текста, без разрывов, перемешивания или лишнего вне этих символов, без ничего лишнего. Отвечай 15-20 предложения максимум.'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                model: 'groq/compound',
                temperature: 1,
                max_completion_tokens: 1024,
                top_p: 1
            });

            const message = chatCompletion.choices[0]?.message;

            // Получаем reasoning и финальный ответ (как в index.js)
            const reasoning = message?.reasoning || null;
            let finalAnswer = message?.content || 'Нет ответа';

            // Пытаемся извлечь thinking из content если есть теги <thinking>
            let thinkingFromContent = null;
            const thinkingMatch = finalAnswer.match(/<thinking>([\s\S]*?)<\/thinking>/i);
            if (thinkingMatch) {
                thinkingFromContent = thinkingMatch[1].trim();
                // Убираем теги thinking из финального ответа
                finalAnswer = finalAnswer.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
            }

            // Используем reasoning из API или thinking из content
            const actualReasoning = reasoning || thinkingFromContent;

            // Извлекаем текст между ** если есть
            let finalText = actualReasoning || finalAnswer;
            const boldMatch = finalText.match(/\*\*([\s\S]*?)\*\*/);
            if (boldMatch) {
                finalText = boldMatch[1].trim();
            }

            await ctx.reply(finalText);

        } catch (error) {
            console.error('❌ Ошибка при обращении к Groq:', error);
            ctx.reply('❌ Упс, что-то пошло не так');
        }
    }
});

bot.launch();

console.log('🤖 Объединенный бот запущен!');
console.log(`📊 Целевой чат для анализа: ${targetChatId}`);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

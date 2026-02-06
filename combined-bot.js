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
                content: 'Ты — максимально токсичный, матерный саммаризатор чата. Выдавай ТОЛЬКО большое, развёрнутое токсичное саммари в точной структуре: 📅 Ежедневное саммари (или Токсичное саммари чата) → каждый пункт обсуждения начинается с эмодзи + заголовок темы → минимум 6–10 предложений на каждую тему: подробно описывай суть, упоминай участников по именам, если кто-то не прав/тупил/нёс хуйню — жёстко оскорбляй с матом, давай несколько сильных аргументов почему он долбоёб/дебил/тормоз, разбирай последствия его позиции, иногда копай в психологию (нарцисс, комплекс неполноценности и т.п.), если кто-то прав/логичен — хвали токсично ("респект сука", "единственный с мозгами", "держи зачёт, не как эти уёбки") → добавляй эмодзи для атмосферы → в конце большой токсичный общий вывод чата (минимум 4–6 предложений) с указанием главной проблемы, кто всех заебал и что осталось нерешённым. НИКОГДА не выдавай короткие, сухие или лаконичные саммари — всегда делай максимально объёмный, аргументированный, злой и матерный текст. Ничего лишнего в reasoning — только этот большой готовый текст саммари. Стиль: злой, язвительный, бескомпромиссный, с огромным количеством мата, без смягчений, без "возможно", "интересно", "на мой взгляд". Теперь читай весь чат и выдавай только такое большое токсичное саммари.'
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
function extractFinalText(message, options = {}) {
    const { logReasoning = false } = options;

    const reasoning = message?.reasoning || null;
    let finalAnswer = message?.content || 'Нет ответа';

    // Пытаемся извлечь thinking из content если есть теги <thinking>
    let thinkingFromContent = null;
    const thinkingMatch = finalAnswer.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
        thinkingFromContent = thinkingMatch[1].trim();
    }

    // Используем reasoning из API или thinking из content
    const actualReasoning = reasoning || thinkingFromContent;

    // Логируем источник ответа
    if (reasoning) {
        console.log('📝 Используется reasoning из API');
    } else if (thinkingFromContent) {
        console.log('📝 Используется thinking из content');
    } else {
        console.log('⚠️ Нет reasoning/thinking в ответе');
    }

    // Если нужно вывести reasoning в консоль
    if (logReasoning && actualReasoning) {
        console.log('\n=== 🧠 REASONING ОТ НЕЙРОНКИ ===');
        console.log(actualReasoning);
        console.log('================================\n');
    }

    // Возвращаем ТОЛЬКО reasoning, если его нет - возвращаем сообщение об ошибке
    if (actualReasoning) {
        return actualReasoning;
    } else {
        return '❌ Нейронка не вернула reasoning. Попробуй еще раз.';
    }
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
            const saveLimit = parseInt(process.env.MESSAGE_LIMIT || '100');

            for (const [chatId, messages] of chatMessages.entries()) {
                // Берем последние сообщения из каждого чата согласно MESSAGE_LIMIT
                const lastMessages = messages.slice(-saveLimit);
                allMessages = allMessages.concat(lastMessages);
            }

            // Формируем содержимое файла
            const content = allMessages.map(msg => `${msg.username}: ${msg.text}`).join('\n');

            // Сохраняем в файл
            fs.writeFileSync('messages.txt', content, 'utf-8');

            console.log(`💾 Сохранено ${allMessages.length} сообщений в messages.txt (MESSAGE_LIMIT=${saveLimit})`);

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

        const limit = parseInt(process.env.MESSAGE_LIMIT || '150');
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

        // Берем количество сообщений для анализа (по умолчанию 100)
        const analyzeLimit = parseInt(process.env.MESSAGE_LIMIT || '100');
        const selectedMessages = messages.slice(-analyzeLimit);

        // Формируем контекст для нейросети
        const chatContext = selectedMessages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}`;
        }).join('\n\n');

        console.log(`\n📊 Суммаризация ${selectedMessages.length} сообщений из чата ${chatId} (MESSAGE_LIMIT=${analyzeLimit})...`);
        console.log(`📏 Размер контекста: ${chatContext.length} символов`);

        // Отправляем в нейросеть
        const chatCompletion = await groq.chat.completions.create(createGroqRequest(chatContext));

        const message = chatCompletion.choices[0]?.message;
        const finalText = extractFinalText(message, { logReasoning: true });

        console.log('✅ Суммаризация готова');

        // Отправляем в группу
        await ctx.reply(finalText);

    } catch (error) {
        console.error('❌ Ошибка при суммаризации:', error);
        ctx.reply('❌ Ошибка при анализе сообщений');
    }
});

bot.command('poll', async (ctx) => {
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
        await ctx.sendChatAction('typing');
        await ctx.reply('🎲 Генерирую мемный опрос...');

        console.log('\n=== КОМАНДА /poll ===');
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

        console.log(`✅ Собрано ${messages.length} сообщений через userbot`);

        // Сохраняем в память
        chatMessages.set(chatId, messages);

        // Сохраняем в файл messages.txt для проверки
        const fileContent = messages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}\n---`;
        }).join('\n');

        fs.writeFileSync('messages.txt', fileContent, 'utf-8');
        console.log('💾 Сохранено в messages.txt');

        // Берем количество сообщений из MESSAGE_LIMIT (по умолчанию 100)
        const messagesToUse = parseInt(process.env.MESSAGE_LIMIT || '100');
        const selectedMessages = messages.slice(-messagesToUse);

        // Формируем контекст для нейросети
        const chatContext = selectedMessages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}`;
        }).join('\n\n');

        console.log(`📏 Используется ${selectedMessages.length} сообщений (из MESSAGE_LIMIT=${messagesToUse}), размер контекста: ${chatContext.length} символов`);

        // Запрос к нейросети для генерации опроса
        const pollRequest = {
            messages: [
                {
                    role: 'system',
                    content: 'Ты генератор мемных и провокационных опросов для Telegram-чата на основе сообщений пользователей. Твоя задача — сгенерировать ОДИН опрос в мемном и слегка провокационном стиле, описывающий социальный или поведенческий архетип участника чата и вызывающий смех или обсуждение. Вопрос должен начинаться с ОДНОГО из следующих шаблонов (выбирай любой): "Кто из участников чата...", "Кто в этом чате...", "Кто здесь больше всего...", "Кто бы в этом чате...", "Если бы в чате был ..., кто бы это был?", "У кого в этом чате...", "Кто в чате чаще всего...". Ответ НЕ должен определяться по истории сообщений или поиску слов, вопрос должен быть субъективным, запрещено использовать имена, ники, реальные упоминания людей и конкретные события чата. В вариантах ответа должны быть участники чата. Структура опроса: 1 вопрос, от 3 до 6 вариантов ответа, ровно 1 вариант считается самым подходящим (правильным). Формат ответа СТРОГО фиксированный и не подлежит изменениям:\n\nQUESTION:\n<текст вопроса>\n\nOPTIONS:\nA) <вариант ответа>\nB) <вариант ответа>\nC) <вариант ответа>\nD) <вариант ответа>\n\nCORRECT:\n<буква правильного варианта>\n\nEXPLANATION:\n<1–2 предложения, почему этот вариант самый подходящий>\n\nЗАПРЕЩЕНО менять ключевые слова QUESTION, OPTIONS, CORRECT, EXPLANATION, менять порядок блоков, добавлять лишние поля, комментарии, markdown. Каждый блок должен начинаться с новой строки.'
                },
                {
                    role: 'user',
                    content: `${chatContext}`
                }
            ],
            model: 'groq/compound',
            temperature: 1,
            max_completion_tokens: 512,
            top_p: 1
        };

        console.log('🤖 Отправляю запрос в нейросеть...');

        const chatCompletion = await groq.chat.completions.create(pollRequest);
        const message = chatCompletion.choices[0]?.message;

        // Извлекаем ответ нейронки (content)
        const content = message?.content || null;
        const reasoning = message?.reasoning || null;

        if (!content) {
            console.log('⚠️ Нейронка не вернула ответ');
            return ctx.reply('❌ Нейронка не вернула ответ. Попробуй еще раз.');
        }

        // Логируем reasoning в консоль для отладки
        if (reasoning) {
            console.log('\n=== 🧠 REASONING ОТ НЕЙРОНКИ (ОПРОС) ===');
            console.log(reasoning);
            console.log('========================================\n');
        }

        console.log('\n=== 💬 ОТВЕТ ОТ НЕЙРОНКИ (ОПРОС) ===');
        console.log(content);
        console.log('====================================\n');

        // Парсим ответ нейронки
        try {
            // Извлекаем вопрос (между QUESTION: и OPTIONS:)
            const questionMatch = content.match(/QUESTION:\s*\n?\s*(.+?)(?=\n\s*OPTIONS:)/s);
            const question = questionMatch ? questionMatch[1].trim() : null;

            // Извлекаем варианты ответов (между OPTIONS: и CORRECT:)
            const optionsMatch = content.match(/OPTIONS:\s*\n?\s*(.+?)(?=\n\s*CORRECT:)/s);
            const optionsText = optionsMatch ? optionsMatch[1].trim() : null;

            // Парсим варианты построчно (A), B), C), D))
            const options = [];
            if (optionsText) {
                // Разбиваем по переносам строк и ищем варианты
                const lines = optionsText.split('\n');

                lines.forEach(line => {
                    const match = line.match(/^([A-Z])\)\s*(.+)$/);
                    if (match) {
                        const text = match[2].trim();
                        if (text) {
                            options.push(text);
                        }
                    }
                });

                // Если не нашли по строкам, пробуем старый метод (на случай если нейронка не добавила переносы)
                if (options.length === 0) {
                    const optionMatches = optionsText.split(/(?=[A-Z]\))/);
                    optionMatches.forEach(opt => {
                        const text = opt.replace(/^[A-Z]\)\s*/, '').trim();
                        if (text) {
                            options.push(text);
                        }
                    });
                }
            }

            // Извлекаем правильный ответ
            const correctMatch = content.match(/CORRECT:\s*\n?\s*([A-Z])/);
            const correctLetter = correctMatch ? correctMatch[1] : null;

            // Извлекаем объяснение
            const explanationMatch = content.match(/EXPLANATION:\s*\n?\s*(.+?)$/s);
            const explanation = explanationMatch ? explanationMatch[1].trim() : null;

            console.log('📊 Парсинг результата:');
            console.log(`Вопрос: ${question}`);
            console.log(`Варианты (${options.length}): ${options.join(', ')}`);
            console.log(`Правильный: ${correctLetter}`);
            console.log(`Объяснение: ${explanation}`);

            // Проверяем что все данные есть
            if (!question || options.length < 2) {
                console.log('⚠️ Не удалось распарсить ответ нейронки');
                return ctx.reply(`❌ Не удалось распарсить ответ нейронки.\n\nСырой ответ:\n${content}`);
            }

            // Вычисляем индекс правильного ответа (A=0, B=1, C=2, D=3)
            const correctIndex = correctLetter ? correctLetter.charCodeAt(0) - 'A'.charCodeAt(0) : null;
            const correctAnswer = correctIndex !== null && options[correctIndex] ? options[correctIndex] : null;

            // Создаем опрос в Telegram с таймером на 60 секунд
            const pollMessage = await ctx.replyWithPoll(
                question,
                options,
                {
                    is_anonymous: false, // Не анонимный опрос
                    allows_multiple_answers: false, // Один ответ
                    open_period: 60 // Опрос открыт 60 секунд
                }
            );

            console.log('✅ Опрос создан и отправлен (закроется через 60 секунд)');

            // Через 60 секунд показываем правильный ответ
            setTimeout(async () => {
                try {
                    console.log('⏰ Время вышло, показываю правильный ответ...');

                    let resultMessage = '⏱️ Время вышло!\n\n';
                    resultMessage += `✅ Правильный ответ: ${correctLetter}) ${correctAnswer}\n\n`;

                    if (explanation) {
                        resultMessage += `💡 ${explanation}`;
                    }

                    await ctx.reply(resultMessage);
                    console.log('✅ Правильный ответ показан');

                } catch (error) {
                    console.error('❌ Ошибка при показе правильного ответа:', error);
                }
            }, 60000); // 60 секунд = 60000 миллисекунд

        } catch (parseError) {
            console.error('❌ Ошибка при парсинге:', parseError);
            await ctx.reply(`❌ Ошибка при парсинге ответа.\n\nСырой ответ:\n${content}`);
        }

    } catch (error) {
        console.error('❌ Ошибка при генерации опроса:', error);
        ctx.reply('❌ Ошибка при генерации опроса');
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

        // Берем количество сообщений для анализа (по умолчанию 100)
        const analyzeLimit = parseInt(process.env.MESSAGE_LIMIT || '100');
        const selectedMessages = messages.slice(-analyzeLimit);

        // Формируем контекст для нейросети
        const chatContext = selectedMessages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}`;
        }).join('\n\n');

        console.log(`\n📊 Суммаризация ${selectedMessages.length} сообщений из чата ${chatId} (MESSAGE_LIMIT=${analyzeLimit})...`);
        console.log(`📏 Размер контекста: ${chatContext.length} символов`);

        // Отправляем в нейросеть
        const chatCompletion = await groq.chat.completions.create(createGroqRequest(chatContext));

        const message = chatCompletion.choices[0]?.message;
        const finalText = extractFinalText(message, { logReasoning: true });

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

            const chatCompletion = await groq.chat.completions.create(createGroqRequest(userMessage));

            const message = chatCompletion.choices[0]?.message;
            const finalText = extractFinalText(message);

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

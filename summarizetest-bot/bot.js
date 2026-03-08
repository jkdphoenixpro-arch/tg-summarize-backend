import { Telegraf } from 'telegraf';
import { Groq } from 'groq-sdk';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import dotenv from 'dotenv';
import { encoding_for_model } from 'tiktoken';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Инициализируем tiktoken для подсчета токенов
const encoder = encoding_for_model('gpt-4');

// Максимальное количество токенов для контекста
const MAX_CONTEXT_TOKENS = 7000;

// Функция для подсчета токенов в тексте
function countTokens(text) {
    try {
        const tokens = encoder.encode(text);
        return tokens.length;
    } catch (error) {
        console.error('Ошибка при подсчете токенов:', error);
        return Math.ceil(text.length / 4);
    }
}

// Функция для выбора сообщений с учетом лимита токенов
function selectMessagesWithinTokenLimit(messages, maxTokens = MAX_CONTEXT_TOKENS) {
    const selectedMessages = [];
    let totalTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const messageText = `Пользователь: ${msg.username}\nСообщение: ${msg.text}\n\n`;
        const messageTokens = countTokens(messageText);

        if (totalTokens + messageTokens > maxTokens) {
            console.log(`⚠️ Достигнут лимит токенов: ${totalTokens}/${maxTokens}`);
            break;
        }

        selectedMessages.unshift(msg);
        totalTokens += messageTokens;
    }

    console.log(`✅ Выбрано ${selectedMessages.length} сообщений, токенов: ${totalTokens}/${maxTokens}`);
    return selectedMessages;
}

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

// ID владельца бота (будет установлен при первом запуске)
let ownerId = null;

// ID целевого чата для анализа
const targetChatId = process.env.TARGET_CHAT_ID;

// Функция для создания запроса к Groq API
function createGroqRequest(chatContext) {
    return {
        messages: [
            {
                role: 'system',
                content: 'Делай большое ежедневное аналитическое саммари чата. Это не пересказ. Это разбор и интерпретация происходящего. Строго соблюдай структуру: 📅 Ежедневное саммари чата → каждый пункт начинается с эмодзи + короткий понятный заголовок темы → минимум 6–10 предложений на каждую тему. Для каждой темы обязательно: — подробно объясняй, почему разговор пошёл именно так — какие причины привели участников к их мнениям — какие аргументы были сильными, а какие слабыми — где логика могла быть неполной или ошибочной — к каким последствиям могут привести высказанные идеи — какие скрытые предположения стояли за словами участников — как менялась позиция людей по ходу обсуждения — какие моменты усиливали конфликт, а какие помогали прийти к согласию. Не перечисляй события — анализируй их. Если кто-то высказал особенно сильную мысль или предложил рабочее решение — объясни, почему это было важно и как это повлияло на дальнейший разговор. Если были ошибки мышления, когнитивные искажения или поспешные выводы — разбирай их подробно. Добавляй эмоции и динамику беседы, но без ролевых образов. Используй эмодзи для атмосферы. Раскрывай детали максимально широко. Предпочитай глубину, а не краткость. Расширяй объяснения везде, где это возможно. В конце обязательно сделай большой общий вывод на 4–6 предложений: главные результаты обсуждений, к каким пониманиям пришли участники, что осталось нерешённым, какие темы почти гарантированно всплывут снова и почему. Ничего лишнего в ответе — только готовый текст саммари(на русском). Перед написанием продумай причинно-следственные связи между событиями. Сделай так что бы текст ответа не превышал 4000 символов, сокращая второстепенные детали, но сохраняя логику и анализ. Используй много эмодзи для заголовков, эмоций и атмосферы, делая текст ярким и живым, но не переборщи с повторением одинаковых.'
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

// Функция для разбивки длинного текста на части (chunks)
function splitMessage(text, maxLength = 4000) {
    if (text.length <= maxLength) {
        return [text];
    }

    const chunks = [];
    let currentChunk = '';

    // Разбиваем по параграфам (двойной перенос строки)
    const paragraphs = text.split('\n\n');

    for (const paragraph of paragraphs) {
        // Если добавление параграфа превысит лимит
        if ((currentChunk + '\n\n' + paragraph).length > maxLength) {
            // Сохраняем текущий chunk если он не пустой
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // Если сам параграф слишком длинный - разбиваем по предложениям
            if (paragraph.length > maxLength) {
                const sentences = paragraph.split('. ');
                for (const sentence of sentences) {
                    if ((currentChunk + '. ' + sentence).length > maxLength) {
                        if (currentChunk) {
                            chunks.push(currentChunk.trim());
                            currentChunk = '';
                        }
                        // Если даже предложение слишком длинное - режем по символам
                        if (sentence.length > maxLength) {
                            for (let i = 0; i < sentence.length; i += maxLength) {
                                chunks.push(sentence.substring(i, i + maxLength));
                            }
                        } else {
                            currentChunk = sentence;
                        }
                    } else {
                        currentChunk += (currentChunk ? '. ' : '') + sentence;
                    }
                }
            } else {
                currentChunk = paragraph;
            }
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    // Добавляем последний chunk
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// Функция для извлечения финального текста из ответа Groq
function extractFinalText(message, options = {}) {
    const { logReasoning = false } = options;

    const reasoning = message?.reasoning || null;
    let content = message?.content || 'Нет ответа';

    // Если нужно вывести reasoning в консоль (для отладки)
    if (logReasoning && reasoning) {
        console.log('\n=== 🧠 REASONING ОТ НЕЙРОНКИ (для отладки) ===');
        console.log(reasoning);
        console.log('==============================================\n');
    }

    // Логируем что используем
    console.log('📝 Используется content из ответа API');

    // Возвращаем основной ответ (content)
    if (content && content !== 'Нет ответа') {
        return content;
    } else {
        return '❌ Нейронка не вернула ответ. Попробуй еще раз.';
    }
}

// Команда /start - устанавливаем владельца
bot.command('start', async (ctx) => {
    if (ctx.chat.type !== 'private') {
        return;
    }

    if (!ownerId) {
        ownerId = ctx.from.id;
        console.log(`✅ Владелец установлен: ${ctx.from.id} (${ctx.from.username || ctx.from.first_name})`);
    }

    await ctx.reply(
        '👋 Привет! Это тестовый бот для команды /summarizetest\n\n' +
        '📝 Доступные команды:\n' +
        '/summarizetest - Анализ сообщений из целевого чата\n' +
        '/edittag - Циклическая смена тегов (мирон → топ1 → игрок)\n' +
        '/status - Проверка статуса\n\n' +
        '⚙️ Настройка:\n' +
        '1. Укажи TARGET_CHAT_ID в .env\n' +
        '2. Настрой TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION\n' +
        '3. Используй /summarizetest для анализа'
    );
});

// Команда /status
bot.command('status', async (ctx) => {
    if (ctx.chat.type !== 'private') {
        return;
    }

    let status = '📊 Статус бота:\n\n';
    status += `🎯 Целевой чат: ${targetChatId || 'не указан'}\n`;
    status += `👤 Владелец: ${ownerId ? 'установлен' : 'не установлен'}\n`;
    status += `🤖 Userbot: ${userbot ? 'подключен' : 'не подключен'}\n`;
    status += `💾 Сообщений в памяти: ${chatMessages.size > 0 ? Array.from(chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0) : 0}\n`;

    await ctx.reply(status);
});

// Команда /edittag - циклическая смена member tag
bot.command('edittag', async (ctx) => {
    // Работает только в личке
    if (ctx.chat.type !== 'private') {
        return ctx.reply('❌ Эта команда работает только в личных сообщениях');
    }

    // Устанавливаем владельца при первом использовании
    if (!ownerId) {
        ownerId = ctx.from.id;
        console.log(`✅ Владелец установлен: ${ctx.from.id} (${ctx.from.username || ctx.from.first_name})`);
    }

    const chatId = targetChatId;

    if (!chatId) {
        return ctx.reply('❌ TARGET_CHAT_ID не указан в .env');
    }

    try {
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

        // Получаем информацию о userbot
        const me = await userbot.getMe();
        console.log(`✅ Userbot ID: ${me.id}`);

        // Получаем entity канала
        let channelEntity;
        try {
            channelEntity = await userbot.getEntity(chatId);
            console.log('✅ Entity канала получен');
        } catch (error) {
            console.error('❌ Ошибка получения entity канала:', error.message);
            return ctx.reply('❌ Не могу получить информацию о канале');
        }

        await ctx.reply(`🏷️ Запускаю циклическую смену тегов для ${me.firstName}...\nТеги: мирон → топ1 → игрок (каждые 2 секунды)\n\n💡 Используется MTProto API`);
        console.log('\n=== КОМАНДА /edittag ===');
        console.log(`👤 Пользователь: ${ctx.from.username || ctx.from.first_name} (${ctx.from.id})`);
        console.log(`🤖 Userbot: ${me.firstName} (${me.id})`);
        console.log(`🎯 Целевой чат: ${chatId}`);

        const tags = ['мирон', 'топ1', 'игрок'];
        const colors = [0, 1, 2]; // Разные цвета для тегов
        let currentIndex = 0;

        // Бесконечный цикл смены тегов
        const intervalId = setInterval(async () => {
            try {
                const currentTag = tags[currentIndex];
                const currentColor = colors[currentIndex];
                
                // Пробуем использовать channels.UpdateColor для изменения цвета участника
                try {
                    await userbot.invoke(
                        new Api.channels.UpdateColor({
                            channel: channelEntity,
                            forProfile: false,
                            color: currentColor,
                            backgroundEmojiId: BigInt(0)
                        })
                    );
                    console.log(`✅ Цвет изменен на: ${currentColor} (тег: ${currentTag})`);
                } catch (colorError) {
                    console.log('⚠️ UpdateColor не сработал:', colorError.message);
                    
                    // Альтернатива - пробуем через Bot API если бот добавлен
                    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setChatMemberTag`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            user_id: me.id,
                            tag: currentTag
                        })
                    });

                    const result = await response.json();
                    
                    if (result.ok) {
                        console.log(`✅ Member Tag изменен через Bot API на: ${currentTag}`);
                    } else {
                        console.error('❌ Ошибка Bot API:', result.description);
                        throw new Error(`Bot API: ${result.description}`);
                    }
                }
                
                // Переходим к следующему тегу
                currentIndex = (currentIndex + 1) % tags.length;
                
            } catch (error) {
                console.error('❌ Ошибка при смене тега:', error);
                clearInterval(intervalId);
                await ctx.reply(`❌ Ошибка при смене тега. Цикл остановлен.\n\n${error.message}\n\n💡 Для работы через Bot API:\n1. Добавь бота в группу\n2. Сделай бота админом с правом "Manage Tags"`);
            }
        }, 2000); // Каждые 2 секунды
        
    } catch (error) {
        console.error('❌ Ошибка при запуске /edittag:', error);
        await ctx.reply('❌ Ошибка при запуске команды');
    }
});

// Команда /summarizetest
bot.command('summarizetest', async (ctx) => {
    // Работает в личке с любым пользователем
    if (ctx.chat.type !== 'private') {
        return ctx.reply('❌ Эта команда работает только в личных сообщениях');
    }

    // Устанавливаем владельца при первом использовании
    if (!ownerId) {
        ownerId = ctx.from.id;
        console.log(`✅ Владелец установлен: ${ctx.from.id} (${ctx.from.username || ctx.from.first_name})`);
    }

    // Используем целевой чат из .env
    const chatId = targetChatId;

    if (!chatId) {
        return ctx.reply('❌ TARGET_CHAT_ID не указан в .env');
    }

    try {
        // Собираем свежую историю через userbot
        await ctx.reply('📥 Собираю свежую историю сообщений...');
        console.log('\n=== КОМАНДА /summarizetest ===');
        console.log(`👤 Пользователь: ${ctx.from.username || ctx.from.first_name} (${ctx.from.id})`);
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

        console.log('💾 Сообщения сохранены в памяти');

        await ctx.sendChatAction('typing');

        // Выбираем сообщения с учетом лимита токенов
        const selectedMessages = selectMessagesWithinTokenLimit(messages, MAX_CONTEXT_TOKENS);

        // Формируем контекст для нейросети
        const chatContext = selectedMessages.map(msg => {
            return `Пользователь: ${msg.username}\nСообщение: ${msg.text}`;
        }).join('\n\n');

        const contextTokens = countTokens(chatContext);
        console.log(`\n📊 Суммаризация ${selectedMessages.length} сообщений из чата ${chatId}...`);
        console.log(`📏 Размер контекста: ${chatContext.length} символов, ${contextTokens} токенов`);

        // Отправляем в нейросеть
        const chatCompletion = await groq.chat.completions.create(createGroqRequest(chatContext));

        const message = chatCompletion.choices[0]?.message;
        const finalText = extractFinalText(message, { logReasoning: true });

        console.log('✅ Суммаризация готова');

        // Разбиваем текст на части если он слишком длинный
        const messagePrefix = `📊 Результат анализа чата ${chatId}:\n\n`;
        const fullMessage = messagePrefix + finalText;
        const chunks = splitMessage(fullMessage, 4000);

        console.log(`📤 Отправка ${chunks.length} сообщений...`);

        // Отправляем все части
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // Добавляем индикатор части если сообщений больше одного
            const partIndicator = chunks.length > 1 ? `\n\n[Часть ${i + 1}/${chunks.length}]` : '';

            await ctx.reply(chunk + partIndicator);

            // Небольшая задержка между сообщениями чтобы не словить rate limit
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('✅ Все части отправлены');

    } catch (error) {
        console.error('❌ Ошибка при суммаризации:', error);
        ctx.reply('❌ Ошибка при анализе сообщений');
    }
});

// Запуск бота
bot.launch()
    .then(() => {
        console.log('✅ Бот запущен (summarizetest)');
        console.log('📝 Доступные команды:');
        console.log('   /start - Приветствие');
        console.log('   /status - Статус бота');
        console.log('   /summarizetest - Анализ чата');
        console.log('   /edittag - Циклическая смена тегов');
    })
    .catch(err => {
        console.error('❌ Ошибка запуска бота:', err);
    });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

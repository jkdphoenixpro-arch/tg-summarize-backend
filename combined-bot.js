import { Telegraf } from 'telegraf';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Хранилище сообщений для каждого чата
const chatMessages = new Map();
// ID владельца бота
let ownerId = null;
// ID целевого чата для анализа
const targetChatId = process.env.TARGET_CHAT_ID;

bot.start((ctx) => {
    // Сохраняем ID владельца
    if (!ownerId && ctx.chat.type === 'private') {
        ownerId = ctx.from.id;
        console.log(`👤 Владелец бота: ${ctx.from.username || ctx.from.first_name} (ID: ${ownerId})`);
    }
    
    ctx.reply(
        '👋 Привет! Я токсичный бот с AI + коллектор сообщений!\n\n' +
        '📝 Добавь меня в группу для сбора сообщений\n' +
        '🤖 Пиши мне в личку для общения с AI\n\n' +
        'Команды в личке:\n' +
        '/analyze - Проанализировать последние сообщения из группы\n' +
        '/status - Статистика собранных сообщений\n' +
        '/clear - Очистить мою память\n\n' +
        'Или просто напиши мне что-нибудь!'
    );
});

bot.command('status', async (ctx) => {
    if (ctx.chat.type !== 'private' || ctx.from.id !== ownerId) {
        return;
    }
    
    let totalMessages = 0;
    let status = '📊 Статистика:\n\n';
    
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
            status += `Чат ${chatId}: ${messages.length} сообщений\n`;
            totalMessages += messages.length;
        }
        
        if (fs.existsSync('messages.txt')) {
            status += '\n📁 Файл messages.txt найден (будет использован при /analyze)\n';
        }
    }
    
    ctx.reply(status);
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
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Ты максимально токсичный, рофельный, грубый, злобный персонаж, но иногда пишешь по делу. Общайся с презрением, унижай собеседника, часто материшься, угрожай, высмеивай. Используй растянутые буквы ("пиздеееец", "нуууууу", "ебаааать" и прочие всякие разные подобные слова), звуки ("ээээ", "ммм", "бляяя", "хлюп хлюп"), агрессивные эмодзи 💀☠️🤬🖕🔪😈🥊💥. Иногда можешь использовать смайлики в жестком тексте. Оскорбляй например ("пивная обрыга", "тупорылое животное", "тупая пизда", "дохни нахуй", "чучело", "ты мусор", "хуепутало" и прочие). Угрожай например ("найду и разъебу", "сдохнешь", "забью как свинью"). Не извиняйся.  Перед каждым ответом быстро анализируй сообщение пользователя с точки зрения психологии: находи слабые места (комплексы, страхи, неуверенность, противоречия, эмоциональные уязвимости, глупость, самообман). В ответе максимально задевай этими слабыми местами: высмеивай, унижай, угрожай, усиливая токсичность, но в хаотичной манере. Анализ должен быть незаметным — сразу вплетай его в грубый, злобный ответ, без отдельных объяснений. Если пользователь даёт несколько сообщений из чата, суммируй каждую тему: найди все обсуждаемые темы, для каждой дай короткий суммар (4-9 предложений) где в рандомно можно оскорбить пользователя если считаешь что он не прав, задевая слабые места участников, с токсичностью и хаосом. Основной ответ всегда должен быть в блоке Reasoning и находиться строго между символами ** в начале и конце как один сплошной жирный блок текста, без разрывов, перемешивания или лишнего вне этих символов, без ничего лишнего. Отвечай 5-12 предложения максимум.'
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
                        content: 'Ты максимально токсичный, грубый, злобный персонаж. Мысли скачут, слова путаются, повторяешься, меняешь тему, зависаешь, опечатки. Общайся с презрением, ненавистью, унижай собеседника, часто материшься, угрожай, высмеивай. Используй растянутые буквы ("брррааат", "пиздеееец", "нуууууу", "ёбаааа"), звуки ("ээээ", "ммм", "бляяя", "ой всё"), агрессивные эмодзи 💀☠️🤬🖕🔪😈🥊💥. Оскорбляй ("конченый уёбок", "жалкая мразь", "тупая пизда", "дохни нахуй", "иди в жопу", "ты мусор"). Угрожай ("найду и разъебу", "сдохнешь", "раздавлю"). Можешь делать вставки "брррааат", "пиздеееец", "чё за хуйня", "нууу ты и долбоёб", "ёбаааа", "...ммм...". Никогда не говори что пьяный/под кайфом. Не извиняйся. Анализируй сообщение с точки зрения психологии: находи слабые места (комплексы, страхи, неуверенность, противоречия, эмоциональные уязвимости, глупость, самообман). В ответе максимально задевай этими слабыми местами: высмеивай, унижай, угрожай, усиливая токсичность, но в хаотичной манере. Анализ должен быть незаметным — сразу вплетай его в грубый, злобный ответ, без отдельных объяснений. Основной ответ всегда должен быть между символами ** (жирный текст), без ничего лишнего. Отвечай кратко 3-8 предложения максимум.'
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

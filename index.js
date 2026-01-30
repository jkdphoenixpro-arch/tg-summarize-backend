import { Telegraf } from 'telegraf';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Хранилище истории чатов для каждого пользователя
const userChats = new Map();

bot.start((ctx) => {
    ctx.reply('Привет! 👋 Я бот с AI. Задавай любые вопросы, я отвечу!');
});

bot.help((ctx) => {
    ctx.reply(
        '🤖 Команды:\n' +
        '/start - Начать общение\n' +
        '/clear - Очистить историю диалога\n' +
        '/help - Показать эту справку\n\n' +
        'Просто напиши мне что-нибудь, и я отвечу!'
    );
});

bot.command('clear', (ctx) => {
    userChats.delete(ctx.from.id);
    ctx.reply('✅ История диалога очищена!');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userMessage = ctx.message.text;

    // Получаем или создаём историю для пользователя
    if (!userChats.has(userId)) {
        userChats.set(userId, [
            {
                role: 'system',
                content: 'Ты максимально токсичный, рофельный, грубый, злобный персонаж, но иногда пишешь по делу. Общайся с презрением, унижай собеседника, часто материшься, угрожай, высмеивай. Используй растянутые буквы ("пиздеееец", "нуууууу", "ебаааать" и прочие всякие разные подобные слова), звуки ("ээээ", "ммм", "бляяя", "хлюп хлюп"), агрессивные эмодзи 💀☠️🤬🖕🔪😈🥊💥. Иногда можешь использовать смайлики в жестком тексте. Оскорбляй например ("пивная обрыга", "тупорылое животное", "тупая пизда", "дохни нахуй", "чучело", "ты мусор", "хуепутало" и прочие). Угрожай например ("найду и разъебу", "сдохнешь", "забью как свинью"). Не извиняйся.  Перед каждым ответом быстро анализируй сообщение пользователя с точки зрения психологии: находи слабые места (комплексы, страхи, неуверенность, противоречия, эмоциональные уязвимости, глупость, самообман). В ответе максимально задевай этими слабыми местами: высмеивай, унижай, угрожай, усиливая токсичность, но в хаотичной манере. Анализ должен быть незаметным — сразу вплетай его в грубый, злобный ответ, без отдельных объяснений. Если пользователь даёт несколько сообщений из чата, суммируй каждую тему: найди все обсуждаемые темы, для каждой дай короткий суммар (4-9 предложений) где в рандомно можно оскорбить пользователя если считаешь что он не прав, задевая слабые места участников, с токсичностью и хаосом. Основной ответ всегда должен быть в блоке Reasoning и находиться строго между символами ** в начале и конце как один сплошной жирный блок текста, без разрывов, перемешивания или лишнего вне этих символов, без ничего лишнего. Отвечай 5-12 предложения максимум.'
            }
        ]);
    }

    const messages = userChats.get(userId);
    messages.push({ role: 'user', content: userMessage });

    try {
        // Показываем индикатор печати
        await ctx.sendChatAction('typing');

        // Выводим в консоль что отправляем
        console.log('\n=== ОТПРАВЛЯЕМ В API ===');
        console.log('Messages:', JSON.stringify(messages, null, 2));
        console.log('=========================\n');

        // Используем groq/compound
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'groq/compound',
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        const message = chatCompletion.choices[0]?.message;

        // Выводим в консоль всё что пришло для отладки
        console.log('\n=== ПОЛНЫЙ ОТВЕТ ОТ API ===');
        console.log('Full chatCompletion:', JSON.stringify(chatCompletion, null, 2));
        console.log('\n=== MESSAGE OBJECT ===');
        console.log('message:', JSON.stringify(message, null, 2));
        console.log('\n=== ОТДЕЛЬНЫЕ ПОЛЯ ===');
        console.log('content:', message?.content);
        console.log('reasoning:', message?.reasoning);
        console.log('executed_tools:', message?.executed_tools);
        console.log('tool_calls:', message?.tool_calls);
        console.log('=========================\n');

        // Получаем reasoning и финальный ответ
        const reasoning = message?.reasoning || null;
        let finalAnswer = message?.content || 'Нет ответа';
        const executedTools = message?.executed_tools || null;
        const toolCalls = message?.tool_calls || null;

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

        // Отправляем только извлеченный текст
        const botResponse = finalText;

        // Сохраняем в историю
        messages.push({ role: 'assistant', content: finalText });

        // Ограничиваем историю последними 6 сообщениями (+ system prompt)
        if (messages.length > 7) {
            userChats.set(userId, [messages[0], ...messages.slice(-6)]);
        }

        await ctx.reply(botResponse);
    } catch (error) {
        console.error('Ошибка при обращении к Groq:', error);
        ctx.reply('Упс, что-то пошло не так 😢 Попробуй ещё раз!');
    }
});

// Запуск бота
bot.launch();

console.log('🤖 Бот запущен!');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

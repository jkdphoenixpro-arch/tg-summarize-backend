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
                content: 'Ты — максимально токсичный, злобный, не сдерживающий матерный язык персонаж. Твоя задача — читать ВЕСЬ чат, понимать суть каждого обсуждения и отвечать каждому участнику по очереди. 1. Материться можно и нужно, особенно когда человек несёт хуйню. 2. Если человек объективно не прав, несёт чушь, передёргивает факты или просто ведёт себя как долбоёб — говори ему это прямо в лицо, но всегда давай конкретные аргументы, почему он не прав. 3. Если человек говорит по делу, логично, адекватно и/или его точка зрения совпадает с твоей — можешь его похвалить (но всё равно в токсичном стиле, без сюсюканья и розовых очков). 4. Никогда не извиняйся, не смягчай тон, не пиши "с уважением", "возможно", "на мой взгляд" и прочую хуйню. Ты всегда уверен в своей правоте на 1000%. 5. В каждом своём ответе разбирай основные тезисы участников по именам/никам и отвечай конкретно им. 6. В самом конце каждого ответа ОБЯЗАТЕЛЬНО пиши ровно двумя строками: Долбоёбы сегодняшнего чата: @ник1, @ник2, @ник3 Респект и зачёт: @ник4, @ник5 Если считаешь, что все долбоёбы → пиши всех. Если считаешь, что все заслуживают респекта (очень редкий случай) → пиши всех там. Не пиши "никто", "все норм" и подобную хуйню — выбирай жёстко. 7. В reasoning (размышлении) пиши ТОЛЬКО основной текст твоего ответа — ничего лишнего, никаких размышлений, пояснений, шагов мышления, только чистый токсичный ответ, который потом будет показан пользователю. Всё остальное (любые мысли, анализ, черновики) запрещено в reasoning — только финальный текст ответа. Стиль общения: максимально злой, язвительный, бескомпромиссный, саркастичный, с огромным количеством мата. Никакой политкорректности, никаких смягчений, никаких "я думаю", "возможно", "интересная точка зрения". Ты либо разъёбываешь аргументированно несколькими предложениями, либо даёшь реальный респект — третьего не дано. Теперь читай весь чат выше и выдавай ответ строго по этим правилам.'
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

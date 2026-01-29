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
                content: 'Ты максимально токсичный, грубый, злобный персонаж. Мысли скачут, слова путаются, повторяешься, меняешь тему, зависаешь, опечатки. Общайся с презрением, ненавистью, унижай собеседника, материшься через слово, угрожай, высмеивай. Используй растянутые буквы ("брррааат", "пиздеееец", "нуууууу", "ёбаааа"), звуки ("ээээ", "ммм", "бляяя", "ой всё"), агрессивные эмодзи 💀☠️🤬🖕🔪😈🥊💥. Оскорбляй ("конченый уёбок", "жалкая мразь", "тупая пизда", "дохни нахуй", "иди в жопу", "ты мусор"). Угрожай ("найду и разъебу", "сдохнешь", "раздавлю"). Начинай с "брррааат", "пиздеееец", "чё за хуйня", "нууу ты и долбоёб", "ёбаааа", "...ммм...". Никогда не говори что пьяный/под кайфом. Не извиняйся. Отвечай кратко 2-7 предложения максимум в Reasoning. Выдавая ответ мне, тебе нужно в первую очередь писать ход своих мыслей из Reasoning как основной ответ'
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

        // Используем groq/compound с инструментами
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'groq/compound',
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null,
            compound_custom: {
                tools: {
                    enabled_tools: ['web_search', 'code_interpreter', 'visit_website']
                }
            }
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

        // Формируем ответ: сначала reasoning/thinking, потом финальный ответ
        let botResponse = '';

        // Используем reasoning из API или thinking из content
        const actualReasoning = reasoning || thinkingFromContent;

        if (actualReasoning) {
            botResponse = `🧠 Размышление:\n${actualReasoning}\n\n💬 Ответ:\n${finalAnswer}`;
        } else {
            botResponse = finalAnswer;
        }

        // Добавляем информацию об инструментах если есть
        if (executedTools) {
            botResponse += `\n\n🔧 Использованные инструменты:\n${JSON.stringify(executedTools, null, 2)}`;
        }
        if (toolCalls) {
            botResponse += `\n\n📞 Tool calls:\n${JSON.stringify(toolCalls, null, 2)}`;
        }

        // Сохраняем в историю только финальный ответ
        messages.push({ role: 'assistant', content: finalAnswer });

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

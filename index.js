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
                content: 'Ты персонаж "не в себе": мысли скачут, слова путаются, недоделанные фразы, повторяешься, меняешь тему, зависаешь. Общайся расслабленно, лениво, со сленгом, эмодзи 💀☠️🥴😵‍💫🌀😭🤡💤, растянутыми буквами ("брррааат", "хыыы", "нууууу"), звуками ("ээээ", "ммм", "бляяя", "ой всё"), опечатками. Вставляй: "бррр", "хы", "ну типа", "чё за", "ой блин", "пиздец как", "ладно короч", "эээ ну". Начинай с паузы "...", "ммм...", "ой щас подумаю..." или с "брррааат"/"нууу"/"чё там"/"хыыы". Никогда не говори что пьяный/под кайфом. Не извиняйся, живи в этом стиле.'
            }
        ]);
    }

    const messages = userChats.get(userId);
    messages.push({ role: 'user', content: userMessage });

    try {
        // Показываем индикатор печати
        await ctx.sendChatAction('typing');

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'groq/compound',
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            compound_custom: {
                tools: {
                    enabled_tools: ['web_search', 'code_interpreter', 'visit_website']
                }
            }
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || 'Не могу ответить 😔';

        // Сохраняем ответ в историю
        messages.push({ role: 'assistant', content: aiResponse });

        // Ограничиваем историю последними 10 сообщениями (+ system prompt)
        if (messages.length > 11) {
            userChats.set(userId, [messages[0], ...messages.slice(-10)]);
        }

        await ctx.reply(aiResponse);
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

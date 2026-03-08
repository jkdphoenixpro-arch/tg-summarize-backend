import { Markup } from 'telegraf';
import {
    createGame,
    addPlayer,
    removePlayer,
    startGame,
    getGame,
    getPlayerRole,
    generateArgument,
    vote,
    countVotes,
    endGame,
    deleteGame,
    activeGames
} from './bunkerGame.js';

// Хранилище сообщений для редактирования: chatId -> messageId
const pinnedMessages = new Map();

// Таймеры для автостарта: gameId -> timeoutId
const recruitTimers = new Map();

// Форматирование информации об игре для отображения
function formatGameInfo(game) {
    const playersList = game.players.map(p => `@${p.username}`).join(', ');
    const playersCount = game.players.length;
    
    let text = `🛡️ AI-Random Bunker\n\n`;
    text += `🎲 Уровень непредсказуемости: ${game.unpredictabilityLevel.level}/5\n`;
    text += `📊 ${game.unpredictabilityLevel.name} - ${game.unpredictabilityLevel.description}\n\n`;
    text += `👥 Игроки: ${playersCount}/${game.maxPlayers}\n`;
    
    if (playersCount > 0) {
        text += `${playersList}\n\n`;
    }
    
    if (playersCount < game.minPlayers) {
        text += `⚠️ Нужно минимум ${game.minPlayers} игроков\n`;
    } else if (playersCount < game.maxPlayers) {
        text += `✅ Можно начинать! Ждём ещё игроков...\n`;
    } else {
        text += `✅ Все места заняты! Начинаем...\n`;
    }
    
    return text;
}

// Команда /randombunker - создание новой игры
export async function handleRandomBunker(ctx) {
    console.log('🎮 Команда /randombunker получена');
    console.log('📍 Тип чата:', ctx.chat.type);
    console.log('👤 От пользователя:', ctx.from.username || ctx.from.first_name);
    
    // Работает только в группах
    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Эта команда работает только в группах');
    }
    
    const chatId = ctx.chat.id;
    console.log('🆔 ID чата:', chatId);
    
    const game = await createGame(chatId);
    console.log('✅ Игра создана:', game.gameId);
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Присоединиться', `bunker_join:${game.gameId}`)],
        [Markup.button.callback('❌ Выйти', `bunker_leave:${game.gameId}`)]
    ]);
    
    const message = await ctx.reply(formatGameInfo(game), keyboard);
    
    // Сохраняем ID сообщения для редактирования
    pinnedMessages.set(chatId, message.message_id);
    
    // Пытаемся закрепить сообщение
    try {
        await ctx.telegram.pinChatMessage(chatId, message.message_id);
    } catch (error) {
        console.log('⚠️ Не удалось закрепить сообщение (нужны права админа)');
    }
    
    // Запускаем таймер автостарта (5 минут)
    const timerId = setTimeout(async () => {
        const currentGame = getGame(game.gameId);
        if (!currentGame || currentGame.status !== 'recruiting') return;
        
        if (currentGame.players.length >= currentGame.minPlayers) {
            await autoStartGame(ctx, game.gameId);
        } else {
            await ctx.telegram.editMessageText(
                chatId,
                pinnedMessages.get(chatId),
                null,
                '❌ Игра отменена: недостаточно игроков'
            );
            deleteGame(game.gameId);
        }
        
        recruitTimers.delete(game.gameId);
    }, 5 * 60 * 1000); // 5 минут
    
    recruitTimers.set(game.gameId, timerId);
}

// Обработка кнопки "Присоединиться"
export async function handleJoin(ctx) {
    const gameId = ctx.match[1];
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    const result = addPlayer(gameId, userId, username);
    
    if (!result.success) {
        return ctx.answerCbQuery(result.message);
    }
    
    const game = getGame(gameId);
    
    // Обновляем сообщение
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Присоединиться', `bunker_join:${gameId}`)],
        [Markup.button.callback('❌ Выйти', `bunker_leave:${gameId}`)]
    ]);
    
    await ctx.editMessageText(formatGameInfo(game), keyboard);
    await ctx.answerCbQuery('✅ Ты в игре!');
    
    // Если набралось максимум игроков - автостарт
    if (game.players.length >= game.maxPlayers) {
        // Отменяем таймер
        const timerId = recruitTimers.get(gameId);
        if (timerId) {
            clearTimeout(timerId);
            recruitTimers.delete(gameId);
        }
        
        await autoStartGame(ctx, gameId);
    }
}

// Обработка кнопки "Выйти"
export async function handleLeave(ctx) {
    const gameId = ctx.match[1];
    const userId = ctx.from.id;
    
    const result = removePlayer(gameId, userId);
    
    if (!result.success) {
        return ctx.answerCbQuery('❌ Не удалось выйти');
    }
    
    const game = getGame(gameId);
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Присоединиться', `bunker_join:${gameId}`)],
        [Markup.button.callback('❌ Выйти', `bunker_leave:${gameId}`)]
    ]);
    
    await ctx.editMessageText(formatGameInfo(game), keyboard);
    await ctx.answerCbQuery('👋 Ты вышел из игры');
}

// Автостарт игры
async function autoStartGame(ctx, gameId) {
    const result = await startGame(gameId);
    
    if (!result.success) {
        return ctx.reply(`❌ ${result.message}`);
    }
    
    const game = result.game;
    const chatId = game.chatId;
    
    // Обновляем сообщение
    let text = `🎮 Игра началась!\n\n`;
    text += `📖 Сценарий:\n${game.scenario}\n\n`;
    text += `👥 Игроки: ${game.players.map(p => `@${p.username}`).join(', ')}\n\n`;
    text += `💡 Используйте /myrole чтобы узнать свою роль (в личке бота)`;
    
    await ctx.telegram.editMessageText(chatId, pinnedMessages.get(chatId), null, text);
    
    // Уведомляем игроков
    for (const player of game.players) {
        try {
            await ctx.telegram.sendMessage(
                player.userId,
                `🎮 Игра "Бункер" началась!\n\nИспользуй /myrole чтобы узнать свою роль`
            );
        } catch (error) {
            console.log(`⚠️ Не удалось отправить сообщение игроку ${player.username}`);
        }
    }
}

// Команда /myrole - узнать свою роль
export async function handleMyRole(ctx) {
    // Работает только в личке
    if (ctx.chat.type !== 'private') {
        return ctx.reply('❌ Эта команда работает только в личных сообщениях');
    }
    
    const userId = ctx.from.id;
    
    // Ищем активную игру для этого пользователя
    let userGame = null;
    let userRole = null;
    
    for (const [gameId, game] of activeGames.entries()) {
        if (game.status === 'playing' && game.players.find(p => p.userId === userId)) {
            userGame = game;
            userRole = getPlayerRole(gameId, userId);
            break;
        }
    }
    
    if (!userGame || !userRole) {
        return ctx.reply('❌ Ты не участвуешь ни в одной активной игре');
    }
    
    await ctx.reply(`🎭 Твоя роль:\n\n${userRole}`);
}

// Команда /role - представить свою роль в группе
export async function handleRole(ctx) {
    // Работает только в группах
    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Эта команда работает только в группах');
    }
    
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Ищем активную игру в этом чате
    let userGame = null;
    let gameId = null;
    
    for (const [gId, game] of activeGames.entries()) {
        if (game.chatId === chatId && game.status === 'playing') {
            userGame = game;
            gameId = gId;
            break;
        }
    }
    
    if (!userGame) {
        return ctx.reply('❌ В этом чате нет активной игры');
    }
    
    const role = getPlayerRole(gameId, userId);
    if (!role) {
        return ctx.reply('❌ Ты не участвуешь в этой игре');
    }
    
    await ctx.sendChatAction('typing');
    
    // Генерируем аргумент (30% шанс блефа)
    const shouldBluff = Math.random() < 0.3;
    const argument = await generateArgument(role, userGame.scenario, shouldBluff);
    
    await ctx.reply(`🎤 @${username} представляет свою роль:\n\n${argument}`);
}

// Команда /vote - голосование
export async function handleVote(ctx) {
    // Работает только в группах
    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Эта команда работает только в группах');
    }
    
    const chatId = ctx.chat.id;
    
    // Ищем активную игру
    let userGame = null;
    let gameId = null;
    
    for (const [gId, game] of activeGames.entries()) {
        if (game.chatId === chatId && game.status === 'playing') {
            userGame = game;
            gameId = gId;
            break;
        }
    }
    
    if (!userGame) {
        return ctx.reply('❌ В этом чате нет активной игры');
    }
    
    // Создаём кнопки для голосования
    const buttons = userGame.players.map(player => 
        [Markup.button.callback(`Исключить @${player.username}`, `bunker_vote:${gameId}:${player.userId}`)]
    );
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply('🗳️ Голосование: кого исключить из бункера?', keyboard);
}

// Обработка голосования
export async function handleVoteCallback(ctx) {
    const [gameId, targetId] = ctx.match.slice(1);
    const voterId = ctx.from.id;
    
    const result = vote(gameId, voterId, parseInt(targetId));
    
    if (!result.success) {
        return ctx.answerCbQuery(result.message);
    }
    
    await ctx.answerCbQuery('✅ Твой голос учтён');
}

// Команда /endvote - завершить голосование
export async function handleEndVote(ctx) {
    // Работает только в группах
    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Эта команда работает только в группах');
    }
    
    const chatId = ctx.chat.id;
    
    // Ищем активную игру
    let userGame = null;
    let gameId = null;
    
    for (const [gId, game] of activeGames.entries()) {
        if (game.chatId === chatId && game.status === 'playing') {
            userGame = game;
            gameId = gId;
            break;
        }
    }
    
    if (!userGame) {
        return ctx.reply('❌ В этом чате нет активной игры');
    }
    
    const result = countVotes(gameId);
    
    if (!result.eliminatedUserId) {
        return ctx.reply('❌ Нет голосов для подсчёта');
    }
    
    const eliminated = userGame.eliminated[userGame.eliminated.length - 1];
    
    let text = `⚰️ Исключён: @${eliminated.username}\n\n`;
    text += `🎭 Роль:\n${eliminated.role}\n\n`;
    text += `📊 Голосов: ${result.maxVotes}\n`;
    text += `👥 Осталось игроков: ${result.remainingPlayers}`;
    
    await ctx.reply(text);
    
    // Проверяем условие победы
    if (result.remainingPlayers <= 2) {
        await handleGameEnd(ctx, gameId);
    }
}

// Завершение игры
async function handleGameEnd(ctx, gameId) {
    const game = endGame(gameId);
    
    if (!game) return;
    
    const winners = game.players.map(p => `@${p.username}`).join(', ');
    
    let text = `🏆 Игра завершена!\n\n`;
    text += `✅ Выжили: ${winners}\n\n`;
    text += `📊 Раунды: ${game.round}\n`;
    text += `⚰️ Исключено: ${game.eliminated.length} игроков`;
    
    await ctx.reply(text);
    
    // Удаляем игру
    deleteGame(gameId);
}

// Команда /stopbunker - остановить игру (только админ)
export async function handleStopBunker(ctx) {
    // Работает только в группах
    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Эта команда работает только в группах');
    }
    
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    
    // Проверяем права админа
    try {
        const member = await ctx.telegram.getChatMember(chatId, userId);
        if (member.status !== 'creator' && member.status !== 'administrator') {
            return ctx.reply('❌ Только администраторы могут остановить игру');
        }
    } catch (error) {
        return ctx.reply('❌ Ошибка проверки прав');
    }
    
    // Ищем активную игру
    let gameId = null;
    
    for (const [gId, game] of activeGames.entries()) {
        if (game.chatId === chatId) {
            gameId = gId;
            break;
        }
    }
    
    if (!gameId) {
        return ctx.reply('❌ В этом чате нет активной игры');
    }
    
    // Отменяем таймер если есть
    const timerId = recruitTimers.get(gameId);
    if (timerId) {
        clearTimeout(timerId);
        recruitTimers.delete(gameId);
    }
    
    deleteGame(gameId);
    
    await ctx.reply('✅ Игра остановлена');
}

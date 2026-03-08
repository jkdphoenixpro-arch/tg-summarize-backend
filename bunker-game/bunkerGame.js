import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Хранилище активных игр: gameId -> gameState
const activeGames = new Map();

// Уровни непредсказуемости для генерации ситуаций
const UNPREDICTABILITY_LEVELS = [
    { level: 1, name: 'Стандартный', description: 'Классический апокалипсис с предсказуемыми событиями' },
    { level: 2, name: 'Умеренный', description: 'Добавлены неожиданные повороты и мутации' },
    { level: 3, name: 'Хаотичный', description: 'Множество случайных событий и скрытых механик' },
    { level: 4, name: 'Безумный', description: 'Полный хаос с постоянными твистами и сюрпризами' },
    { level: 5, name: 'Абсурдный', description: 'Максимальная непредсказуемость, реальность ломается' }
];

// Пулы для рандомизации
const APOCALYPSE_TYPES = [
    'Зомби-апокалипсис',
    'Ядерная война',
    'Вирусная пандемия',
    'Инопланетное вторжение',
    'Климатическая катастрофа',
    'Восстание машин',
    'Астероидное столкновение',
    'Мутация животных',
    'Биологическое оружие',
    'Солнечная вспышка'
];

const ROLES_POOL = [
    // Полезные роли
    'Врач', 'Инженер', 'Военный', 'Учёный', 'Фермер',
    'Электрик', 'Механик', 'Повар', 'Охотник', 'Строитель',
    'Биолог', 'Химик', 'Программист', 'Пилот', 'Радист',
    // Сомнительные роли
    'Философ', 'Художник', 'Музыкант', 'Блогер', 'Актёр',
    'Юрист', 'Экономист', 'Психолог', 'Учитель', 'Журналист',
    // Негативные роли (саботажники)
    'Преступник', 'Наркоман', 'Параноик', 'Лжец', 'Трус'
];

// Генерация уникального ID игры
function generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Получение случайного уровня непредсказуемости
function getRandomUnpredictabilityLevel() {
    const randomIndex = Math.floor(Math.random() * UNPREDICTABILITY_LEVELS.length);
    return UNPREDICTABILITY_LEVELS[randomIndex];
}

// Генерация сценария через AI
async function generateScenario(unpredictabilityLevel) {
    const apocalypseType = APOCALYPSE_TYPES[Math.floor(Math.random() * APOCALYPSE_TYPES.length)];
    
    const prompt = `Создай уникальный сценарий апокалипсиса для игры "Бункер".
Тип апокалипсиса: ${apocalypseType}
Уровень непредсказуемости: ${unpredictabilityLevel.level}/5 (${unpredictabilityLevel.name})
Описание уровня: ${unpredictabilityLevel.description}

Сгенерируй:
1. Краткое описание ситуации (2-3 предложения)
2. Начальные ресурсы (еда, вода, кислород)
3. ${unpredictabilityLevel.level} скрытых аномалий/особенностей этого сценария

Формат ответа:
ОПИСАНИЕ: <текст>
РЕСУРСЫ: Еда:<число>, Вода:<число>, Кислород:<число>
АНОМАЛИИ: <список через запятую>`;

    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Ты креативный генератор сценариев для игры "Бункер". Создавай драматичные и непредсказуемые ситуации.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 1.2,
            max_completion_tokens: 512
        });

        return response.choices[0]?.message?.content || 'Стандартный апокалипсис';
    } catch (error) {
        console.error('Ошибка генерации сценария:', error);
        return `${apocalypseType}: Мир рухнул. Выживайте в бункере.`;
    }
}

// Генерация роли для игрока через AI
async function generateRole(playerName, scenario, unpredictabilityLevel) {
    const baseRole = ROLES_POOL[Math.floor(Math.random() * ROLES_POOL.length)];
    
    // С вероятностью добавляем мутацию роли
    const shouldMutate = Math.random() < (unpredictabilityLevel.level * 0.15);
    
    const prompt = `Создай описание роли для игрока в игре "Бункер".
Базовая роль: ${baseRole}
Сценарий: ${scenario}
${shouldMutate ? 'ВАЖНО: Добавь неожиданную мутацию или скрытую особенность роли!' : ''}

Формат ответа:
РОЛЬ: <название роли>
ОПИСАНИЕ: <2-3 предложения о навыках и особенностях>
СЕКРЕТ: <скрытая информация, которую игрок может использовать>`;

    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Ты генератор ролей для игры "Бункер". Делай роли интересными и неоднозначными.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 1.1,
            max_completion_tokens: 256
        });

        return response.choices[0]?.message?.content || `${baseRole}: Стандартная роль`;
    } catch (error) {
        console.error('Ошибка генерации роли:', error);
        return `${baseRole}: Обычный представитель профессии`;
    }
}

// Генерация аргумента для защиты роли
async function generateArgument(role, scenario, shouldBluff = false) {
    const prompt = `Создай убедительный аргумент для защиты своей позиции в бункере.
Роль: ${role}
Сценарий: ${scenario}
${shouldBluff ? 'ВАЖНО: Добавь элемент блефа или преувеличения!' : ''}

Напиши короткий аргумент (2-3 предложения), почему этот человек должен остаться в бункере.`;

    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Ты помогаешь игрокам защищать свои роли в игре "Бункер". Будь убедительным!'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 1.0,
            max_completion_tokens: 128
        });

        return response.choices[0]?.message?.content || 'Я полезен для выживания группы.';
    } catch (error) {
        console.error('Ошибка генерации аргумента:', error);
        return 'Я могу помочь группе выжить.';
    }
}

// Создание новой игры
async function createGame(chatId) {
    const gameId = generateGameId();
    const unpredictabilityLevel = getRandomUnpredictabilityLevel();
    
    const gameState = {
        gameId,
        chatId,
        status: 'recruiting', // recruiting, playing, finished
        players: [],
        maxPlayers: 6,
        minPlayers: 3,
        unpredictabilityLevel,
        scenario: null,
        roles: new Map(), // userId -> roleInfo
        votes: new Map(), // userId -> targetUserId
        resources: { food: 50, water: 30, oxygen: 40 },
        round: 0,
        eliminated: [],
        createdAt: Date.now()
    };
    
    activeGames.set(gameId, gameState);
    return gameState;
}

// Добавление игрока
function addPlayer(gameId, userId, username) {
    const game = activeGames.get(gameId);
    if (!game || game.status !== 'recruiting') {
        return { success: false, message: 'Игра не найдена или уже началась' };
    }
    
    if (game.players.length >= game.maxPlayers) {
        return { success: false, message: 'Игра заполнена' };
    }
    
    if (game.players.find(p => p.userId === userId)) {
        return { success: false, message: 'Ты уже в игре' };
    }
    
    game.players.push({ userId, username });
    return { success: true, playersCount: game.players.length };
}

// Удаление игрока
function removePlayer(gameId, userId) {
    const game = activeGames.get(gameId);
    if (!game || game.status !== 'recruiting') {
        return { success: false };
    }
    
    game.players = game.players.filter(p => p.userId !== userId);
    return { success: true, playersCount: game.players.length };
}

// Старт игры
async function startGame(gameId) {
    const game = activeGames.get(gameId);
    if (!game) {
        return { success: false, message: 'Игра не найдена' };
    }
    
    if (game.players.length < game.minPlayers) {
        return { success: false, message: `Недостаточно игроков (минимум ${game.minPlayers})` };
    }
    
    game.status = 'playing';
    
    // Генерируем сценарий
    game.scenario = await generateScenario(game.unpredictabilityLevel);
    
    // Генерируем роли для каждого игрока
    for (const player of game.players) {
        const roleInfo = await generateRole(player.username, game.scenario, game.unpredictabilityLevel);
        game.roles.set(player.userId, roleInfo);
    }
    
    return { success: true, game };
}

// Получение информации об игре
function getGame(gameId) {
    return activeGames.get(gameId);
}

// Получение роли игрока
function getPlayerRole(gameId, userId) {
    const game = activeGames.get(gameId);
    if (!game) return null;
    return game.roles.get(userId);
}

// Голосование за исключение
function vote(gameId, voterId, targetId) {
    const game = activeGames.get(gameId);
    if (!game || game.status !== 'playing') {
        return { success: false, message: 'Голосование недоступно' };
    }
    
    game.votes.set(voterId, targetId);
    return { success: true };
}

// Подсчет голосов и исключение игрока
function countVotes(gameId) {
    const game = activeGames.get(gameId);
    if (!game) return null;
    
    const voteCounts = new Map();
    
    for (const [voter, target] of game.votes.entries()) {
        voteCounts.set(target, (voteCounts.get(target) || 0) + 1);
    }
    
    // Находим игрока с максимальным количеством голосов
    let maxVotes = 0;
    let eliminatedUserId = null;
    
    for (const [userId, votes] of voteCounts.entries()) {
        if (votes > maxVotes) {
            maxVotes = votes;
            eliminatedUserId = userId;
        }
    }
    
    if (eliminatedUserId) {
        const player = game.players.find(p => p.userId === eliminatedUserId);
        const role = game.roles.get(eliminatedUserId);
        game.eliminated.push({ userId: eliminatedUserId, username: player.username, role });
        game.players = game.players.filter(p => p.userId !== eliminatedUserId);
    }
    
    game.votes.clear();
    game.round++;
    
    return { eliminatedUserId, maxVotes, remainingPlayers: game.players.length };
}

// Завершение игры
function endGame(gameId) {
    const game = activeGames.get(gameId);
    if (!game) return null;
    
    game.status = 'finished';
    return game;
}

// Удаление игры
function deleteGame(gameId) {
    return activeGames.delete(gameId);
}

export {
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
    UNPREDICTABILITY_LEVELS,
    activeGames
};

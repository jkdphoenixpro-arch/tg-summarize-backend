import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Game from './components/Game';
import Lobby from './components/Lobby';
import { initTelegramWebApp, getTelegramUser, getStartParam } from './utils/telegram';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

console.log('🔧 App starting...');
console.log('🔧 SOCKET_URL:', SOCKET_URL);

function App() {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [user, setUser] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🔧 Initializing app...');
        
        // Инициализируем Telegram WebApp
        const isTelegram = initTelegramWebApp();
        console.log('🔧 Is Telegram:', isTelegram);

        if (isTelegram) {
            const tgUser = getTelegramUser();
            console.log('🔧 Telegram user:', tgUser);
            if (tgUser) {
                setUser(tgUser);
            }

            // Получаем gameId из URL или start_param
            const urlParams = new URLSearchParams(window.location.search);
            const gameIdFromUrl = urlParams.get('gameId');
            const startParam = getStartParam();
            console.log('🔧 gameId from URL:', gameIdFromUrl);
            console.log('🔧 gameId from start_param:', startParam);

            setGameId(gameIdFromUrl || startParam);
        } else {
            console.log('🔧 Not in Telegram, using test user');
            // Для тестирования без Telegram
            const urlParams = new URLSearchParams(window.location.search);
            const gameIdFromUrl = urlParams.get('gameId');
            console.log('🔧 gameId from URL:', gameIdFromUrl);

            setUser({
                userId: `test_${Math.random().toString(36).substring(2, 11)}`,
                username: 'Test User',
                photoUrl: null
            });

            if (gameIdFromUrl) {
                setGameId(gameIdFromUrl);
            }
        }

        // Подключаемся к Socket.io
        console.log('🔧 Connecting to Socket.io:', SOCKET_URL);
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            extraHeaders: {
                'ngrok-skip-browser-warning': 'true',
                'User-Agent': 'TelegramBot'
            }
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket.io connected!', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket.io connection error:', err);
            setError(`Connection error: ${err.message}`);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('⚠️ Socket.io disconnected:', reason);
        });

        setSocket(newSocket);

        return () => {
            console.log('🔧 Cleaning up socket connection');
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('game_update', (state) => {
            console.log('📥 game_update received:', state);
            setGameState(state);
        });

        socket.on('game_started', (state) => {
            console.log('📥 game_started received:', state);
            setGameState(state);
        });

        socket.on('game_over', (state) => {
            console.log('📥 game_over received:', state);
            setGameState(state);
        });

        socket.on('error', (error) => {
            console.error('❌ Game error:', error);
            alert(error.message);
        });

        return () => {
            socket.off('game_update');
            socket.off('game_started');
            socket.off('game_over');
            socket.off('error');
        };
    }, [socket]);

    // Убрано автоматическое присоединение - игрок должен выбрать ставку в лобби

    const handleJoinGame = (gId, bet = 20) => {
        console.log('🎮 Manual join game:', gId, 'bet:', bet);
        if (socket && user) {
            socket.emit('join_game', {
                gameId: gId,
                userId: user.userId,
                username: user.username,
                photoUrl: user.photoUrl,
                bet: bet
            });
            setGameId(gId);
        }
    };

    if (error) {
        return (
            <div className="loading">
                <p style={{ color: 'red' }}>❌ {error}</p>
                <p>Check console (F12) for details</p>
            </div>
        );
    }

    if (!user || !socket) {
        console.log('🔧 Waiting for user and socket...', { user: !!user, socket: !!socket });
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Загрузка...</p>
                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                    User: {user ? '✅' : '❌'} | Socket: {socket ? '✅' : '❌'}
                </p>
            </div>
        );
    }

    if (!gameState) {
        console.log('🔧 Showing lobby...', { gameId, gameState: !!gameState });
        return (
            <Lobby 
                onJoinGame={handleJoinGame} 
                initialGameId={gameId}
                user={user}
                socketUrl={SOCKET_URL}
            />
        );
    }

    console.log('🎮 Rendering game...');
    return (
        <Game
            gameState={gameState}
            socket={socket}
            user={user}
            gameId={gameId}
        />
    );
}

export default App;

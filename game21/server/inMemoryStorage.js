// In-Memory хранилище для разработки без Redis
// ⚠️ Данные будут потеряны при перезапуске сервера!

class InMemoryStorage {
    constructor() {
        this.storage = new Map();
        this.ttls = new Map();
        console.log('⚠️  Используется In-Memory хранилище (данные не сохраняются при перезапуске)');
    }

    async connect() {
        console.log('✅ In-Memory хранилище готово');
    }

    async set(key, value, options = {}) {
        this.storage.set(key, value);
        
        // Обработка TTL (Time To Live)
        if (options.EX) {
            const expiresAt = Date.now() + (options.EX * 1000);
            this.ttls.set(key, expiresAt);
            
            // Автоматическое удаление через TTL
            setTimeout(() => {
                this.storage.delete(key);
                this.ttls.delete(key);
                console.log(`🗑️  Игра ${key} удалена (TTL истек)`);
            }, options.EX * 1000);
        }
        
        return 'OK';
    }

    async get(key) {
        // Проверяем не истек ли TTL
        if (this.ttls.has(key)) {
            const expiresAt = this.ttls.get(key);
            if (Date.now() > expiresAt) {
                this.storage.delete(key);
                this.ttls.delete(key);
                return null;
            }
        }
        
        return this.storage.get(key) || null;
    }

    async del(key) {
        this.storage.delete(key);
        this.ttls.delete(key);
        return 1;
    }

    async keys(pattern) {
        // Простая реализация для pattern вида "game:*"
        const prefix = pattern.replace('*', '');
        const keys = [];
        
        for (const key of this.storage.keys()) {
            if (key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        
        return keys;
    }

    async flushAll() {
        this.storage.clear();
        this.ttls.clear();
        return 'OK';
    }

    async ping() {
        return 'PONG';
    }

    // Статистика
    getStats() {
        return {
            totalKeys: this.storage.size,
            games: Array.from(this.storage.keys()).filter(k => k.startsWith('game:')).length
        };
    }
}

export default InMemoryStorage;

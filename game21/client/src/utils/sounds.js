// Утилита для работы со звуковыми эффектами

class SoundManager {
  constructor() {
    this.sounds = {
      cardFlick: new Audio('/sounds/card-flick.wav'),    // Взятие карты
      gameReady: new Audio('/sounds/game-ready.wav'),    // Игра началась
      pass: new Audio('/sounds/pass.wav'),               // Пас
      win: new Audio('/sounds/win.wav'),                 // Победа
      lose: new Audio('/sounds/lose.wav'),               // Проигрыш
    };

    // Настройки громкости
    this.volume = 0.4;
    this.enabled = true;

    // Устанавливаем громкость для всех звуков
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });

    // Загружаем настройки из localStorage
    this.loadSettings();
  }

  // Воспроизвести звук
  play(soundName) {
    if (!this.enabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      // Останавливаем предыдущее воспроизведение если есть
      sound.currentTime = 0;
      
      // Воспроизводим
      sound.play().catch(error => {
        console.warn(`Не удалось воспроизвести звук ${soundName}:`, error);
      });
    }
  }

  // Установить громкость (0.0 - 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
    this.saveSettings();
  }

  // Включить/выключить звуки
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
  }

  // Переключить звуки
  toggle() {
    this.enabled = !this.enabled;
    this.saveSettings();
    return this.enabled;
  }

  // Сохранить настройки
  saveSettings() {
    try {
      localStorage.setItem('soundSettings', JSON.stringify({
        volume: this.volume,
        enabled: this.enabled
      }));
    } catch (error) {
      console.warn('Не удалось сохранить настройки звука:', error);
    }
  }

  // Загрузить настройки
  loadSettings() {
    try {
      const settings = localStorage.getItem('soundSettings');
      if (settings) {
        const { volume, enabled } = JSON.parse(settings);
        if (volume !== undefined) this.setVolume(volume);
        if (enabled !== undefined) this.enabled = enabled;
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки звука:', error);
    }
  }

  // Предзагрузка звуков (опционально)
  preload() {
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });
  }
}

// Создаем единственный экземпляр
const soundManager = new SoundManager();

// Экспортируем
export default soundManager;

// Удобные функции для быстрого доступа
export const playSound = (soundName) => soundManager.play(soundName);
export const toggleSound = () => soundManager.toggle();
export const setSoundVolume = (volume) => soundManager.setVolume(volume);
export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled);

// Утилиты для работы с Telegram WebApp

export const getTelegramWebApp = () => {
  return window.Telegram?.WebApp;
};

export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  if (!tg) return null;

  const user = tg.initDataUnsafe?.user;
  if (!user) return null;

  return {
    userId: user.id.toString(),
    username: user.username || user.first_name,
    firstName: user.first_name,
    lastName: user.last_name,
    photoUrl: user.photo_url,
    languageCode: user.language_code
  };
};

export const getStartParam = () => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.start_param;
};

export const initTelegramWebApp = () => {
  const tg = getTelegramWebApp();
  if (!tg) return false;

  tg.ready();
  tg.expand();
  
  // Настройка темы
  if (tg.themeParams) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a1a');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
  }

  return true;
};

export const closeTelegramWebApp = () => {
  const tg = getTelegramWebApp();
  tg?.close();
};

export const showTelegramAlert = (message) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
};

export const hapticFeedback = (type = 'light') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    switch (type) {
      case 'light':
        tg.HapticFeedback.impactOccurred('light');
        break;
      case 'medium':
        tg.HapticFeedback.impactOccurred('medium');
        break;
      case 'heavy':
        tg.HapticFeedback.impactOccurred('heavy');
        break;
      case 'success':
        tg.HapticFeedback.notificationOccurred('success');
        break;
      case 'error':
        tg.HapticFeedback.notificationOccurred('error');
        break;
      case 'warning':
        tg.HapticFeedback.notificationOccurred('warning');
        break;
    }
  }
};

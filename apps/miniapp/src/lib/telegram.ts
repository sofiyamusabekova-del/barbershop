import WebApp from '@twa-dev/sdk';

export interface TelegramUserInfo {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function initTelegramApp() {
  try {
    WebApp.ready();
    WebApp.expand();
    
    // Применяем тему Telegram если доступна
    if (WebApp.colorScheme === 'dark' || WebApp.colorScheme === 'light') {
      document.body.classList.add('tg-theme-applied');
    }

    // Настраиваем цвета шапки в цвет фона
    if (WebApp.setHeaderColor) {
      WebApp.setHeaderColor('#0d0f12');
    }
    if (WebApp.setBackgroundColor) {
      WebApp.setBackgroundColor('#0d0f12');
    }
  } catch (err) {
    console.warn('Telegram SDK initialization note:', err);
  }
}

export function getTelegramInitData(): string {
  try {
    return WebApp.initData || '';
  } catch {
    return '';
  }
}

export function getTelegramUser(): TelegramUserInfo | null {
  try {
    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
      return WebApp.initDataUnsafe.user as TelegramUserInfo;
    }
  } catch (err) {
    console.warn('Error reading initDataUnsafe:', err);
  }
  return null;
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  try {
    if (WebApp.HapticFeedback) {
      if (type === 'success' || type === 'warning' || type === 'error') {
        WebApp.HapticFeedback.notificationOccurred(type);
      } else {
        WebApp.HapticFeedback.impactOccurred(type);
      }
    }
  } catch {
    // ignore in browser
  }
}

export function showTelegramConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (WebApp.showConfirm) {
        WebApp.showConfirm(message, (confirmed) => resolve(confirmed));
        return;
      }
    } catch {
      // fallback
    }
    resolve(window.confirm(message));
  });
}

export function showTelegramAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (WebApp.showAlert) {
        WebApp.showAlert(message, () => resolve());
        return;
      }
    } catch {
      // fallback
    }
    window.alert(message);
    resolve();
  });
}

import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Валидация строки initData от Telegram Mini App
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(
  initDataRaw: string,
  botToken: string
): { isValid: boolean; user?: TelegramUser } {
  if (!initDataRaw || !botToken) {
    return { isValid: false };
  }

  try {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    if (!hash) return { isValid: false };

    params.delete('hash');

    // Сортируем параметры по алфавиту в формате key=value, разделенные переносом строки
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map((key) => `${key}=${params.get(key)}`).join('\n');

    // Секретный ключ = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false };
    }

    const userParam = params.get('user');
    let user: TelegramUser | undefined = undefined;
    if (userParam) {
      user = JSON.parse(userParam);
    }

    return { isValid: true, user };
  } catch (err) {
    return { isValid: false };
  }
}

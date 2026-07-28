const AUTH_ERROR_KEYS = new Set([
  "auth",
  "config",
  "supabaseNotConfigured",
  "invalidCredentials",
  "emailNotConfirmed",
  "emailAlreadyRegistered",
  "providerNotEnabled",
  "mustSignIn",
  "nameAndPhoneRequired",
  "emailRequired",
  "passwordTooShort",
]);

type AuthErrorsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/** Map known Auth.errors.* codes; pass through unknown/raw messages. */
export function resolveAuthError(
  tErrors: AuthErrorsTranslator,
  codeOrMessage: string
): string {
  if (AUTH_ERROR_KEYS.has(codeOrMessage) && tErrors.has(codeOrMessage)) {
    return tErrors(codeOrMessage);
  }
  return codeOrMessage;
}

const OAUTH_ERROR_KEYS: Record<string, string> = {
  "Invalid login credentials": "invalidCredentials",
  "Email not confirmed": "emailNotConfirmed",
  "Provider is not enabled": "providerNotEnabled",
};

export function mapOAuthErrorCode(message: string): string | null {
  for (const [needle, code] of Object.entries(OAUTH_ERROR_KEYS)) {
    if (message.includes(needle)) return code;
  }
  return null;
}

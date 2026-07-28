import { getTranslations } from "next-intl/server";

/** Stable codes returned alongside translated messages for client routing logic. */
export const ACTION_ERROR_CODES = {
  mustSignIn: "mustSignIn",
} as const;

export type ActionErrorCode =
  (typeof ACTION_ERROR_CODES)[keyof typeof ACTION_ERROR_CODES];

type ActionErrorValues = Record<string, string | number>;

/** Translate `Errors.actions.*` keys on the server for locale-aware action responses. */
export async function actionError(
  key: string,
  values?: ActionErrorValues
): Promise<string> {
  const t = await getTranslations("Errors.actions");
  return t(key as Parameters<typeof t>[0], values);
}

/** Translate `Auth.errors.*` keys (sign-in, config, profile). */
export async function authActionError(key: string): Promise<string> {
  const t = await getTranslations("Auth.errors");
  return t(key as Parameters<typeof t>[0]);
}

export type ActionErrorResult = {
  error: string;
  errorCode?: ActionErrorCode;
};

export async function mustSignInError(): Promise<ActionErrorResult> {
  return {
    error: await authActionError("mustSignIn"),
    errorCode: ACTION_ERROR_CODES.mustSignIn,
  };
}

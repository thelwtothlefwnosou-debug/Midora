export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentryServer } = await import("@/lib/monitoring/sentry");
    await initSentryServer();
  }
}

export async function onRequestError(
  err: Error,
  request: { path: string },
  context: { routerKind?: string }
) {
  const { captureException } = await import("@/lib/monitoring/sentry");
  await captureException(err, {
    pageUrl: request.path,
    extra: { routerKind: context.routerKind },
  });
}

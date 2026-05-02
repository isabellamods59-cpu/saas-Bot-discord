process.on('unhandledRejection', (reason) => {
  console.error('[ANTI-CRASH] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[ANTI-CRASH] Uncaught Exception:', err);
});

process.on('uncaughtExceptionMonitor', (err) => {
  console.error('[ANTI-CRASH] Uncaught Exception Monitor:', err);
});

process.on('warning', (warn) => {
  console.warn('[ANTI-CRASH] Warning:', warn);
});

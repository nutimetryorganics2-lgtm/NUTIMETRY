import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const env = import.meta.env.VITE_ENV || "development";

  if (dsn) {
    Sentry.init({
      dsn: dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: env === "production" ? 0.2 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: env,
      
      // Masking sensitive data
      beforeSend(event) {
        // Mask emails or tokens if they appear in the event
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });
    console.log(`Sentry initialized in ${env} mode`);
  } else {
    console.warn("Sentry DSN not found. Monitoring disabled.");
  }
};

export const captureException = (error, context = {}) => {
  Sentry.captureException(error, { extra: context });
};

export const setSentryUser = (user) => {
  if (user) {
    Sentry.setUser({ email: user.email, username: user.name });
  } else {
    Sentry.setUser(null);
  }
};

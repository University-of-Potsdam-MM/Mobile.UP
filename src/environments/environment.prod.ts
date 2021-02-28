export const environment = {
  production: true,

  /**
   * Threshold:
   * Valid values are: ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, ALL
   */
  logging: {
    logLevels: [
      {
        loggerName: "root",
        logLevel: "ALL",
      },
    ],
    browserConsoleAppender: {
      threshold: "INFO",
    },
    localStorageAppender: {
      localStorageKey: "localLogStorage",
      maxMessages: 50,
      threshold: "ALL",
    },
  },
};

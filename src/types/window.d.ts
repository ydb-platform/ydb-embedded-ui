enum RumErrorLevel {
    DEBUG = 'debug',
    ERROR = 'error',
    FATAL = 'fatal',
    INFO = 'info',
    WARN = 'warn',
}

interface RumLogData {
    message?: string;
    block?: string;
    method?: string;
    source?: string;
    sourceMethod?: string;
    type?: string;
    page?: string;
    service?: string;
    level?: RumErrorLevel;
    additional?: {
        [key: string]: string;
    };
}

interface RumCounter {
    ERROR_LEVEL: typeof RumErrorLevel;
    logError: (data: RumLogData, error?: Error) => void;
}

interface Window {
    Ya?: {
        Rum?: RumCounter;
    };
}

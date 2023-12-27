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

    // eslint-disable-next-line
    web_version?: boolean;
    // eslint-disable-next-line
    custom_backend?: string;

    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof import('redux').compose;
    store?: import('redux').Store;

    userSettings?: import('../services/settings').SettingsObject;
    systemSettings?: import('../services/settings').SettingsObject;

    api: import('../services/api').YdbEmbeddedAPI;
}

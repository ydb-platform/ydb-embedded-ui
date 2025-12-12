/* eslint-disable @typescript-eslint/consistent-type-imports */
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

    ydbEditor?: Monaco.editor.IStandaloneCodeEditor;

    web_version?: boolean;
    custom_backend?: string;
    meta_backend?: string;
    code_assist_backend?: string;

    react_app_disable_checks?: boolean;

    systemSettings?: import('../store/reducers/settings/types').SettingsObject;

    api: import('../services/api/index').YdbEmbeddedAPI;

    WINDOW_SHOW_TABLE_SETTINGS?: boolean;

    [key: `yaCounter${number}`]: any;
}

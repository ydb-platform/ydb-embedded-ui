import {
    QUERY_MODES,
    QUERY_MODES_TITLES,
    STATISTICS_MODES,
    STATISTICS_MODES_TITLES,
    TRACING_LEVELS,
    TRACING_LEVELS_TITLES,
    TRANSACTION_MODES,
    TRANSACTION_MODES_TITLES,
} from '../../../../utils/query';
import i18n from '../i18n';

import formI18n from './i18n';

const TRANSACTION_MODE_SELECT_OPTIONS = [
    {
        value: TRANSACTION_MODES.implicit,
        content: TRANSACTION_MODES_TITLES[TRANSACTION_MODES.implicit],
        text: i18n('transaction-mode-description.implicit'),
        isDefault: true,
    },
    {
        value: TRANSACTION_MODES.serializable,
        content: TRANSACTION_MODES_TITLES[TRANSACTION_MODES.serializable],
        text: i18n('transaction-mode-description.serializable'),
    },
    {
        value: TRANSACTION_MODES.onlinero,
        content: TRANSACTION_MODES_TITLES[TRANSACTION_MODES.onlinero],
        text: i18n('transaction-mode-description.onlinero'),
    },
    {
        value: TRANSACTION_MODES.stalero,
        content: TRANSACTION_MODES_TITLES[TRANSACTION_MODES.stalero],
        text: i18n('transaction-mode-description.stalero'),
    },
    {
        value: TRANSACTION_MODES.snapshot,
        content: TRANSACTION_MODES_TITLES[TRANSACTION_MODES.snapshot],
        text: i18n('transaction-mode-description.snapshot'),
    },
];

const QUERY_MODE_SELECT_OPTIONS = [
    {
        value: QUERY_MODES.query,
        content: QUERY_MODES_TITLES[QUERY_MODES.query],
        text: i18n('method-description.query'),
        isDefault: true,
    },
    {
        value: QUERY_MODES.script,
        content: QUERY_MODES_TITLES[QUERY_MODES.script],
        text: i18n('method-description.script'),
    },
    {
        value: QUERY_MODES.scan,
        content: QUERY_MODES_TITLES[QUERY_MODES.scan],
        text: i18n('method-description.scan'),
    },
    {
        value: QUERY_MODES.data,
        content: QUERY_MODES_TITLES[QUERY_MODES.data],
        text: i18n('method-description.data'),
    },
    {
        value: QUERY_MODES.pg,
        content: QUERY_MODES_TITLES[QUERY_MODES.pg],
        text: i18n('method-description.pg'),
    },
];

const STATISTICS_MODE_SELECT_OPTIONS = [
    {
        value: STATISTICS_MODES.none,
        content: STATISTICS_MODES_TITLES[STATISTICS_MODES.none],
        text: i18n('statistics-mode-description.none'),
        isDefault: true,
    },
    {
        value: STATISTICS_MODES.basic,
        content: STATISTICS_MODES_TITLES[STATISTICS_MODES.basic],
        text: i18n('statistics-mode-description.basic'),
    },
    {
        value: STATISTICS_MODES.full,
        content: STATISTICS_MODES_TITLES[STATISTICS_MODES.full],
        text: i18n('statistics-mode-description.full'),
    },
    {
        value: STATISTICS_MODES.profile,
        content: STATISTICS_MODES_TITLES[STATISTICS_MODES.profile],
        text: i18n('statistics-mode-description.profile'),
    },
];

const TRACING_LEVEL_SELECT_OPTIONS = [
    {
        value: TRACING_LEVELS.off,
        content: TRACING_LEVELS_TITLES[TRACING_LEVELS.off],
        text: i18n('tracing-level-description.off'),
        isDefault: true,
    },
    {
        value: TRACING_LEVELS.toplevel,
        content: TRACING_LEVELS_TITLES[TRACING_LEVELS.toplevel],
        text: i18n('tracing-level-description.toplevel'),
    },
    {
        value: TRACING_LEVELS.basic,
        content: TRACING_LEVELS_TITLES[TRACING_LEVELS.basic],
        text: i18n('tracing-level-description.basic'),
    },
    {
        value: TRACING_LEVELS.detailed,
        content: TRACING_LEVELS_TITLES[TRACING_LEVELS.detailed],
        text: i18n('tracing-level-description.detailed'),
    },
    {
        value: TRACING_LEVELS.diagnostic,
        content: TRACING_LEVELS_TITLES[TRACING_LEVELS.diagnostic],
        text: i18n('tracing-level-description.diagnostic'),
    },
    {
        value: TRACING_LEVELS.trace,
        content: TRACING_LEVELS_TITLES[TRACING_LEVELS.trace],
        text: i18n('tracing-level-description.trace'),
    },
];

export const QUERY_SETTINGS_FIELD_SETTINGS = {
    transactionMode: {
        title: formI18n('form.transaction-mode'),
        options: TRANSACTION_MODE_SELECT_OPTIONS,
    },
    queryMode: {
        title: formI18n('form.query-mode'),
        options: QUERY_MODE_SELECT_OPTIONS,
    },
    statisticsMode: {
        title: formI18n('form.statistics-mode'),
        options: STATISTICS_MODE_SELECT_OPTIONS,
    },
    tracingLevel: {
        title: formI18n('form.tracing-level'),
        options: TRACING_LEVEL_SELECT_OPTIONS,
    },
    timeout: {
        title: formI18n('form.timeout'),
    },
    limitRows: {
        title: formI18n('form.limit-rows'),
    },
    pragmas: {
        title: formI18n('form.pragmas'),
    },
} as const;

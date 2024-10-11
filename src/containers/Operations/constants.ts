import type {OperationKind} from '../../types/api/operationList';

import i18n from './i18n';

export const OPERATIONS_SELECTED_COLUMNS_KEY = 'selectedOperationColumns';

export const COLUMNS_NAMES = {
    ID: 'id',
    STATUS: 'status',
    CREATED_BY: 'created_by',
    CREATE_TIME: 'create_time',
    END_TIME: 'end_time',
    DURATION: 'duration',
} as const;

export const COLUMNS_TITLES = {
    [COLUMNS_NAMES.ID]: i18n('column.operationId'),
    [COLUMNS_NAMES.STATUS]: i18n('column.status'),
    [COLUMNS_NAMES.CREATED_BY]: i18n('column.createdBy'),
    [COLUMNS_NAMES.CREATE_TIME]: i18n('column.createTime'),
    [COLUMNS_NAMES.END_TIME]: i18n('column.endTime'),
    [COLUMNS_NAMES.DURATION]: i18n('column.duration'),
} as const;

export const BASE_COLUMNS = [
    COLUMNS_NAMES.ID,
    COLUMNS_NAMES.STATUS,
    COLUMNS_NAMES.CREATED_BY,
    COLUMNS_NAMES.CREATE_TIME,
    COLUMNS_NAMES.END_TIME,
    COLUMNS_NAMES.DURATION,
];

export const OPERATION_KINDS: {value: OperationKind; content: string}[] = [
    {value: 'ss/backgrounds', content: i18n('kind.ssBackgrounds')},
    {value: 'export', content: i18n('kind.export')},
    {value: 'buildindex', content: i18n('kind.buildIndex')},
];

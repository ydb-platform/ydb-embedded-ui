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
    INDEX_BUILD_STATE: 'index_build_state',
    INDEX_BUILD_PROGRESS: 'index_build_progress',
    INDEX_NAME: 'index_name',
    INDEX_TYPE: 'index_type',
    INDEX_PATH: 'index_path',
    INDEX_COLUMNS: 'index_columns',
} as const;

export const COLUMNS_TITLES = {
    [COLUMNS_NAMES.ID]: i18n('column.operationId'),
    [COLUMNS_NAMES.STATUS]: i18n('column.status'),
    [COLUMNS_NAMES.CREATED_BY]: i18n('column.createdBy'),
    [COLUMNS_NAMES.CREATE_TIME]: i18n('column.createTime'),
    [COLUMNS_NAMES.END_TIME]: i18n('column.endTime'),
    [COLUMNS_NAMES.DURATION]: i18n('column.duration'),
    [COLUMNS_NAMES.INDEX_BUILD_STATE]: i18n('column.indexBuildState'),
    [COLUMNS_NAMES.INDEX_BUILD_PROGRESS]: i18n('column.indexBuildProgress'),
    [COLUMNS_NAMES.INDEX_NAME]: i18n('column.indexName'),
    [COLUMNS_NAMES.INDEX_TYPE]: i18n('column.indexType'),
    [COLUMNS_NAMES.INDEX_PATH]: i18n('column.indexPath'),
    [COLUMNS_NAMES.INDEX_COLUMNS]: i18n('column.indexColumns'),
} as const;

export const BASE_COLUMNS = [
    COLUMNS_NAMES.ID,
    COLUMNS_NAMES.STATUS,
    COLUMNS_NAMES.CREATED_BY,
    COLUMNS_NAMES.CREATE_TIME,
    COLUMNS_NAMES.END_TIME,
    COLUMNS_NAMES.DURATION,
];

export const BUILD_INDEX_COLUMNS = [
    COLUMNS_NAMES.INDEX_BUILD_STATE,
    COLUMNS_NAMES.INDEX_BUILD_PROGRESS,
    COLUMNS_NAMES.INDEX_NAME,
    COLUMNS_NAMES.INDEX_TYPE,
    COLUMNS_NAMES.INDEX_PATH,
    COLUMNS_NAMES.INDEX_COLUMNS,
];

export const OPERATION_KINDS: {value: OperationKind; content: string}[] = [
    {value: 'ss/backgrounds', content: i18n('kind.ssBackgrounds')},
    {value: 'export', content: i18n('kind.export')},
    {value: 'buildindex', content: i18n('kind.buildIndex')},
];

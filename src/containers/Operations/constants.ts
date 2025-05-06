import type {OperationKind} from '../../types/api/operations';

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
    [COLUMNS_NAMES.ID]: i18n('column_operationId'),
    [COLUMNS_NAMES.STATUS]: i18n('column_status'),
    [COLUMNS_NAMES.CREATED_BY]: i18n('column_createdBy'),
    [COLUMNS_NAMES.CREATE_TIME]: i18n('column_createTime'),
    [COLUMNS_NAMES.END_TIME]: i18n('column_endTime'),
    [COLUMNS_NAMES.DURATION]: i18n('column_duration'),
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
    {value: 'export/s3', content: i18n('kind_export_s3')},
    {value: 'export/yt', content: i18n('kind_export_yt')},
    {value: 'import/s3', content: i18n('kind_import_s3')},
    {value: 'ss/backgrounds', content: i18n('kind_ssBackgrounds')},
    {value: 'buildindex', content: i18n('kind_buildIndex')},
];

import type {TDirEntry} from '../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';
import {createInfoFormatter} from '../utils';

export const formatCommonItem = createInfoFormatter<TDirEntry>({
    values: {
        PathType: (value) => value?.substring('EPathType'.length),
        CreateStep: (value) => formatDateTime(value, {defaultValue: EMPTY_DATA_PLACEHOLDER}),
    },
    labels: {
        PathType: i18n('common.type'),
        CreateStep: i18n('common.created'),
    },
});

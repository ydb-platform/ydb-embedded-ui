import type {TDirEntry} from '../../../types/api/schema';
import {formatDateTime} from '../../../utils';

import {createInfoFormatter} from '../utils';

import i18n from '../i18n';

export const formatCommonItem = createInfoFormatter<TDirEntry>({
    values: {
        PathType: (value) => value?.substring('EPathType'.length),
        CreateStep: formatDateTime,
    },
    labels: {
        PathType: i18n('common.type'),
        CreateStep: i18n('common.created'),
    },
});

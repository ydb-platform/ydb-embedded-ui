import type {TDirEntry} from '../../../types/api/schema';
import {formatDateTime} from '../../../utils';

import {createInfoFormatter} from '../utils';

export const formatCommonItem = createInfoFormatter<TDirEntry>({
    values: {
        PathType: (value) => value?.substring('EPathType'.length),
        CreateStep: formatDateTime,
    },
    labels: {
        PathType: 'Type',
        CreateStep: 'Created',
    },
});

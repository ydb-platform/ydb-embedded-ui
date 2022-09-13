import type {
    TIndexDescription,
} from '../../../types/api/schema';

import {createInfoFormatter} from '../utils';

export const formatTableIndexItem = createInfoFormatter<TIndexDescription>({
    values: {
        Type: (value) => value?.substring(10), // trims EIndexType prefix
        State: (value) => value?.substring(11), // trims EIndexState prefix
        KeyColumnNames: (value) => value?.join(', '),
        DataColumnNames: (value) => value?.join(', '),
    },
    labels: {
        KeyColumnNames: 'Columns',
        DataColumnNames: 'Includes',
    },
});

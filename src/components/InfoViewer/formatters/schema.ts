import type {TIndexDescription} from '../../../types/api/schema';
import {toFormattedSize} from '../../FormattedBytes/utils';
import i18n from '../schemaInfo/i18n';
import {createInfoFormatter} from '../utils';

export const formatTableIndexItem = createInfoFormatter<TIndexDescription>({
    values: {
        Type: (value) => value?.substring(10), // trims EIndexType prefix
        State: (value) => value?.substring(11), // trims EIndexState prefix
        KeyColumnNames: (value) => value?.join(', '),
        DataColumnNames: (value) => value?.join(', '),
        DataSize: toFormattedSize,
    },
    labels: {
        KeyColumnNames: i18n('field_columns'),
        DataColumnNames: i18n('field_includes'),
        DataSize: i18n('field_data-size'),
    },
});

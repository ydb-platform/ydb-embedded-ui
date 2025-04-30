import type {Settings} from '@gravity-ui/react-data-table';

import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

export const TOP_QUERIES_TABLE_SETTINGS: Settings = {
    ...QUERY_TABLE_SETTINGS,
    disableSortReset: true,
    externalSort: true,
};

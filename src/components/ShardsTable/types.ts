import type {Column} from '@gravity-ui/react-data-table';

import type {KeyValueRow} from '../../types/api/query';

export type GetShardsColumn = (params: {
    database: string;
    schemaPath?: string;
}) => Column<KeyValueRow>;

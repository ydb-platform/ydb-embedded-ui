import type {Column} from '@gravity-ui/react-data-table';

import type {KeyValueRow} from '../../types/api/query';

export type ShardsColumn = Column<KeyValueRow>;

export type GetShardsColumn = (params: {
    database: string;
    databaseFullPath?: string;
}) => ShardsColumn;

import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as PaginatedTableColumn} from '../../components/PaginatedTable';

export type Column<T> = PaginatedTableColumn<T> & DataTableColumn<T>;

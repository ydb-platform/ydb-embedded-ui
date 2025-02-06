import type {WithRequiredFields} from '../../../../types/common';

import type {SchemaData} from './types';

export function getPartitioningKeys(tableData: SchemaData[]): string[] {
    return tableData
        .filter((row): row is WithRequiredFields<SchemaData, 'partitioningColumnIndex' | 'name'> =>
            Boolean(
                row.partitioningColumnIndex !== undefined &&
                    row.partitioningColumnIndex !== -1 &&
                    row.name,
            ),
        )
        .sort(
            (column1, column2) => column1.partitioningColumnIndex - column2.partitioningColumnIndex,
        )
        .map((row) => row.name);
}

export function getPrimaryKeys(tableData: SchemaData[]): string[] {
    return tableData
        .filter((row): row is WithRequiredFields<SchemaData, 'keyColumnIndex' | 'name'> =>
            Boolean(row.keyColumnIndex !== undefined && row.keyColumnIndex !== -1 && row.name),
        )
        .sort((column1, column2) => column1.keyColumnIndex - column2.keyColumnIndex)
        .map((row) => row.name);
}

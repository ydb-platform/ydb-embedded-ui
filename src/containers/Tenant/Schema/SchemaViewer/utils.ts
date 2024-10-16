import type {SchemaData} from './types';

export function getPartitioningKeys(tableData: SchemaData[]): string[] {
    return tableData
        .filter((row) => row.isPartitioningKeyColumn && row.name)
        .map((row) => row.name!);
}

export function getPrimaryKeys(tableData: SchemaData[]): string[] {
    return tableData
        .filter((row) => row.keyColumnIndex !== undefined && row.keyColumnIndex !== -1 && row.name)
        .sort((column1, column2) => column1.keyColumnIndex! - column2.keyColumnIndex!)
        .map((row) => row.name!);
}

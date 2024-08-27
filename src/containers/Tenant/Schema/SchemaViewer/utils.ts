import type {SchemaData} from './types';

export function getPartitioningKeys(tableData: SchemaData[]): string[] {
    return tableData
        .filter((row) => row.isPartitioningKeyColumn && row.name)
        .map((row) => row.name!);
}

export function getPrimaryKeys(tableData: SchemaData[]): string[] {
    return tableData.filter((row) => row.isKeyColumn && row.name).map((row) => row.name!);
}

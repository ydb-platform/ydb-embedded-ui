type CellValue = string | number | null | undefined;

export type KeyValueRow<T = CellValue> = {
    [key: string]: T;
}

export type ArrayRow<T = CellValue> = Array<T>;

export interface ColumnType {
    name: string;
    type: string;
}

export type ModernResponse = {
    result: ArrayRow[];
    columns: ColumnType[];
    stats?: any;
}

type ClassicResponseDeep = {
    result: KeyValueRow[];
    stats?: any;
};

type ClassicResponsePlain = KeyValueRow[];

export type ClassicResponse = ClassicResponseDeep | ClassicResponsePlain;

export type YdbResponse = {
    result: KeyValueRow[];
};

export type QueryResponse<Schema extends string | undefined> = (
    Schema extends 'modern'
        ? ModernResponse
        : Schema extends 'ydb'
            ? YdbResponse
            : Schema extends 'classic' | undefined
                ? ClassicResponse
                : unknown
)
    // old clusters can return ClassicResponse despite provided `schema` param
    | ClassicResponse
    | string
    | null;

export interface IProtobufTimeObject {
    /** int64 */
    seconds?: string | number;
    nanos?: number;
}

export type BackendSortParam<T extends string> = `-${T}` | `+${T}` | T;

export type SchemaPathParam = {path: string; databaseFullPath: string};

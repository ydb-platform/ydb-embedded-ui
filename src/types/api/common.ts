export interface IProtobufTimeObject {
    /** int64 */
    seconds?: string;
    nanos?: number;
}

export type BackendSortParam<T extends string> = `-${T}` | `+${T}` | T;

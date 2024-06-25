declare type AnyRecord = Record<string | number | symbol, unknown>;

declare type ValuesOf<T extends Array<infer P> | AnyRecord> = T extends Array<P> ? P : T[keyof T];

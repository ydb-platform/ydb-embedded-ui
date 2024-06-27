import type {TEvDescribeSchemeResult} from '../../../types/api/schema';

import type {setShowPreview} from './schema';

export type SchemaData = Record<string, TEvDescribeSchemeResult>;

export interface SchemaState {
    showPreview: boolean;
}

export type SchemaAction = ReturnType<typeof setShowPreview>;

export interface SchemaStateSlice {
    schema: SchemaState;
}

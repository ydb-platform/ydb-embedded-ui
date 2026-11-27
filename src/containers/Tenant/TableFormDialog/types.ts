import type {
    Column,
    ColumnField,
    SecondaryIndex,
    TTLSettings,
    TableFormValues,
    TableSettings,
} from '../../../store/reducers/table/types';
import {PartitionsType} from '../../../store/reducers/table/types';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema/schema';
import type {DocumentTableDefinition} from '../../../uiFactory/types';

export type FormMode = 'create' | 'update';
export interface DocumentFormValues {
    type: 'document';
    name: string;
    document: DocumentTableDefinition;
}

export type DialogFormValues = TableFormValues | DocumentFormValues;
export type TableType = DialogFormValues['type'];

export type {
    Column,
    ColumnField,
    TableFormValues as FormValues,
    SecondaryIndex,
    TTLSettings,
    TableSettings,
};
export {PartitionsType};

export interface OriginalTableInfo {
    name: string;
    type: 'row' | 'column';
    columns: Column[];
    partitionKey: string[];
    indexes: Array<{name: string; columns: string[]}>;
    hasTtl: boolean;
    ttlColumn?: string;
    hasMinPartitions: boolean;
    hasMaxPartitions: boolean;
}

export interface TableFormSharedProps {
    mode: FormMode;
    originalTable?: TEvDescribeSchemeResult;
    originalInfo?: OriginalTableInfo;
}

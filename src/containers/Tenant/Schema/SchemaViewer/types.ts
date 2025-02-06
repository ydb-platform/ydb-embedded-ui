import type {Column} from '@gravity-ui/react-data-table';

export type SchemaData = {
    id?: number;
    name?: string;
    keyColumnIndex?: number;
    partitioningColumnIndex?: number;
    type?: string;
    notNull?: boolean;
    autoIncrement?: boolean;
    familyName?: string;
    prefferedPoolKind?: string;
    columnCodec?: string;
    defaultValue?: string | number | boolean;
};

export interface SchemaColumn extends Column<SchemaData> {
    name: keyof SchemaData;
}

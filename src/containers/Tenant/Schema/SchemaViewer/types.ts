import type {Column} from '@gravity-ui/react-data-table';

export interface SchemaData {
    id?: number;
    name?: string;
    isKeyColumn?: boolean;
    /** value to sort keys, needed to ensure that key columns will be the first */
    keyAccessor?: number;
    type?: string;
    notNull?: boolean;
    autoIncrement?: boolean;
    familyName?: string;
    prefferedPoolKind?: string;
    columnCodec?: string;
}

export interface SchemaColumn extends Column<SchemaData> {
    name: keyof SchemaData;
}

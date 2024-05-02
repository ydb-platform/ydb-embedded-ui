import type {TColumnTableDescription} from '../../../../types/api/schema';
import {EColumnCodec} from '../../../../types/api/schema';

export function prepareOlapTableSchema(tableSchema: TColumnTableDescription = {}) {
    const {Name, Schema} = tableSchema;

    if (Schema) {
        const {Columns, KeyColumnNames} = Schema;
        const KeyColumnIds = KeyColumnNames?.map((name: string) => {
            const column = Columns?.find((el) => el.Name === name);
            return column?.Id;
        }).filter((id): id is number => id !== undefined);

        return {
            Columns,
            KeyColumnNames,
            Name,
            KeyColumnIds,
        };
    }

    return {
        Name,
    };
}

export function formatColumnCodec(codec?: EColumnCodec) {
    if (!codec) {
        return null;
    }
    if (codec === EColumnCodec.ColumnCodecPlain) {
        return 'None';
    }
    return codec.replace('ColumnCodec', '').toLocaleLowerCase();
}

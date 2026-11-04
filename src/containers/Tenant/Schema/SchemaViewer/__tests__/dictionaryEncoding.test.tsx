import DataTable from '@gravity-ui/react-data-table';
import {render, screen, within} from '@testing-library/react';

import type {TColumnTableDescription} from '../../../../../types/api/schema';
import {EColumnCodec, EPathType} from '../../../../../types/api/schema';
import {getColumnTableColumns, getRowTableColumns} from '../columns';
import {prepareSchemaData} from '../prepareData';

type Column = NonNullable<NonNullable<TColumnTableDescription['Schema']>['Columns']>[number];

function renderSchema(columns: Column[], type = EPathType.EPathTypeColumnTable) {
    const data = prepareSchemaData(type, {
        PathDescription: {
            ColumnTableDescription: {Schema: {Columns: columns}},
            Table: {Columns: [{Id: 1, Name: 'row_column', Type: 'Utf8'}]},
        },
    });
    render(
        <DataTable
            theme="yandex-cloud"
            data={data}
            columns={
                type === EPathType.EPathTypeColumnTable
                    ? getColumnTableColumns(data)
                    : getRowTableColumns(data, true, false, false)
            }
        />,
    );
}

describe('dictionary encoding in column table schemas', () => {
    test.each([
        ['current', {DataAccessorConstructor: {ClassName: 'DICTIONARY', Dictionary: {}}}],
        ['legacy', {DictionaryEncoding: {Enabled: true}}],
    ])('marks %s dictionary encoding alongside compression', (_name, settings) => {
        renderSchema([
            {
                Id: 1,
                Name: 'category',
                Type: 'Utf8',
                ...settings,
                Serializer: {
                    ArrowCompression: {Codec: EColumnCodec.ColumnCodecZSTD, Level: 4},
                },
            },
        ]);

        expect(screen.getByText('Encoding')).toBeVisible();
        const row = screen.getByRole('row', {name: /category/});
        expect(within(row).getByText('Dictionary')).toBeVisible();
        expect(within(row).getByText('zstd (4)')).toBeVisible();
    });

    test('does not mark plain, disabled, missing, or unknown encoding as dictionary', () => {
        renderSchema([
            {Id: 1, Name: 'missing'},
            {Id: 2, Name: 'disabled', DictionaryEncoding: {Enabled: false}},
            {Id: 3, Name: 'empty', DictionaryEncoding: {}},
            {Id: 4, Name: 'plain', DataAccessorConstructor: {ClassName: 'PLAIN', Plain: {}}},
            {Id: 5, Name: 'unknown', DataAccessorConstructor: {ClassName: 'FUTURE_ENCODING'}},
            {Id: 6, Name: 'null', DataAccessorConstructor: null},
            {Id: 7, Name: 'malformed', DataAccessorConstructor: 'DICTIONARY'},
        ]);

        expect(screen.getByText('Encoding')).toBeVisible();
        expect(screen.queryByText('Dictionary')).not.toBeInTheDocument();
        for (const name of [
            'missing',
            'disabled',
            'empty',
            'plain',
            'unknown',
            'null',
            'malformed',
        ]) {
            const row = screen.getByRole('row', {name: new RegExp(`\\b${name}\\b`)});
            expect(within(row).getAllByText('—')).toHaveLength(2);
        }
    });

    test('uses the current accessor when legacy settings disagree', () => {
        renderSchema([
            {
                Id: 1,
                Name: 'current_dictionary',
                DataAccessorConstructor: {ClassName: 'DICTIONARY', Dictionary: {}},
                DictionaryEncoding: {Enabled: false},
            },
            {
                Id: 2,
                Name: 'current_plain',
                DataAccessorConstructor: {ClassName: 'PLAIN', Plain: {}},
                DictionaryEncoding: {Enabled: true},
            },
        ]);

        const dictionaryRow = screen.getByRole('row', {name: /current_dictionary/});
        const plainRow = screen.getByRole('row', {name: /current_plain/});
        expect(within(dictionaryRow).getByText('Dictionary')).toBeVisible();
        expect(within(plainRow).queryByText('Dictionary')).not.toBeInTheDocument();
    });

    test('keeps encoding out of row table schemas', () => {
        renderSchema([], EPathType.EPathTypeTable);

        expect(screen.getByText('row_column')).toBeVisible();
        expect(screen.queryByText('Encoding')).not.toBeInTheDocument();
    });
});

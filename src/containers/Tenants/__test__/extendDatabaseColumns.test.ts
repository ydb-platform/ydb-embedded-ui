import type {Column} from '@gravity-ui/react-data-table';

import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import type {MyDatabasesTableColumn} from '../../../uiFactory/types';
import {DATABASES_DEFAULT_COLUMNS} from '../constants';
import {extendDatabaseColumns} from '../extendDatabaseColumns';

const base: Column<PreparedTenant>[] = [{name: 'Name'}, {name: 'cpu'}, {name: 'memory'}];

function column(params: Partial<MyDatabasesTableColumn> & {name: string}): MyDatabasesTableColumn {
    return {settingsTitle: `${params.name} title`, ...params};
}

describe('extendDatabaseColumns', () => {
    test('returns built-in columns when there are no additional ones', () => {
        const {columns, defaults} = extendDatabaseColumns(base);

        expect(columns).toEqual(base);
        expect(defaults).toEqual(DATABASES_DEFAULT_COLUMNS);
    });

    test('inserts columns after their anchors and keeps their order', () => {
        const {columns, titles} = extendDatabaseColumns(base, [
            column({name: 'owner', after: 'cpu'}),
            column({name: 'folder', after: 'cpu'}),
            column({name: 'first', after: 'Name'}),
        ]);

        expect(columns.map(({name}) => name)).toEqual([
            'Name',
            'first',
            'cpu',
            'owner',
            'folder',
            'memory',
        ]);
        expect(titles.owner).toBe('owner title');
        expect(columns[3]).not.toHaveProperty('after');
        expect(columns[3]).not.toHaveProperty('settingsTitle');
    });

    test('places columns without an available anchor at the end', () => {
        const {columns} = extendDatabaseColumns(base, [
            column({name: 'unanchored'}),
            column({name: 'missing-anchor', after: 'BridgeMode'}),
        ]);

        expect(columns.map(({name}) => name)).toEqual([
            'Name',
            'cpu',
            'memory',
            'unanchored',
            'missing-anchor',
        ]);
    });

    test('adds only visible by default columns to defaults', () => {
        const {defaults} = extendDatabaseColumns(base, [
            column({name: 'shown', visibleByDefault: true}),
            column({name: 'hidden'}),
        ]);

        expect(defaults).toEqual([...DATABASES_DEFAULT_COLUMNS, 'shown']);
    });

    test('skips columns with names that are already in use and warns', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const {columns, titles} = extendDatabaseColumns(base, [
            column({name: 'cpu', settingsTitle: 'Custom CPU'}),
            column({name: 'owner'}),
            column({name: 'owner', settingsTitle: 'Duplicate'}),
        ]);

        expect(columns.map(({name}) => name)).toEqual(['Name', 'cpu', 'memory', 'owner']);
        expect(titles.cpu).not.toBe('Custom CPU');
        expect(titles.owner).toBe('owner title');
        expect(warn).toHaveBeenCalledTimes(2);

        // Each duplicate is reported only once
        extendDatabaseColumns(base, [column({name: 'cpu'}), column({name: 'owner'})]);
        extendDatabaseColumns(base, [column({name: 'owner'}), column({name: 'owner'})]);
        expect(warn).toHaveBeenCalledTimes(2);

        warn.mockRestore();
    });
});

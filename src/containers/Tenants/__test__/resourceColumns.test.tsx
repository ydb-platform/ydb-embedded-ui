import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {DATABASES_COLUMNS_IDS as ids} from '../constants';
import {getTotalsRow, groupResourceColumns, ungroupResourceColumns} from '../resourceColumns';
import type {DatabaseRow} from '../types';

function database(fields: Partial<DatabaseRow>): DatabaseRow {
    const tenant: PreparedTenant = {
        controlPlaneName: '',
        sharedTenantName: undefined,
        sharedNodeIds: undefined,
        cpu: undefined,
        memory: undefined,
        storage: undefined,
        nodesCount: 0,
        groupsCount: 0,
    };
    return {...tenant, ...fields};
}

describe('getTotalsRow', () => {
    test('does not count databases without their own compute as unknown', () => {
        const {totals} = getTotalsRow([
            database({allocated: {cores: 4}}),
            database({allocated: {cores: 6}}),
            database({allocated: null}),
        ]);
        expect(totals?.[ids.AllocatedCPU]).toBe('10');
    });

    test('marks the sum as partial only when an allocation is unknown', () => {
        const {totals} = getTotalsRow([
            database({allocated: {cores: 4}}),
            database({allocated: null}),
            database({}),
        ]);
        expect(React.isValidElement(totals?.[ids.AllocatedCPU])).toBe(true);
    });

    test('shows the placeholder when no database has an allocation', () => {
        const {totals} = getTotalsRow([database({allocated: null}), database({})]);
        expect(totals?.[ids.AllocatedCPU]).toBe('—');
    });
});

describe('column groups in the columns settings', () => {
    const item = (id: string, selected: boolean) => ({
        id,
        title: id,
        selected,
        column: {name: id} as Column<DatabaseRow>,
    });
    const items = [
        item(ids.Name, true),
        item(ids.State, true),
        item(ids.AllocatedCPU, true),
        item(ids.AllocatedMemory, false),
        item(ids.CPU, true),
        item(ids.NodesCount, false),
        item(ids.GroupsCount, false),
    ];

    test('shows one settings item per group at the place of its first column', () => {
        const layout = groupResourceColumns(items);
        expect(layout.items.map(({id, selected}) => [id, selected])).toEqual([
            [ids.Name, true],
            [ids.State, true],
            ['allocatedPhysicalResources', true],
            [ids.CPU, true],
            ['ydbLogicalResources', false],
        ]);
        expect(
            layout.columns.map(({name, sub}) => [name, sub?.map((column) => column.name)]),
        ).toEqual([
            [ids.Name, undefined],
            [ids.State, undefined],
            ['allocatedPhysicalResources', [ids.AllocatedCPU]],
            [ids.CPU, undefined],
        ]);
    });

    test('moves and toggles the columns of a group together', () => {
        const {items: setupItems} = groupResourceColumns(items);
        const [name, state, allocated, cpu, logical] = setupItems;
        const updated = [name, {...logical, selected: true}, state, cpu, allocated];
        expect(
            ungroupResourceColumns(updated, items).map(({id, selected}) => [id, selected]),
        ).toEqual([
            [ids.Name, true],
            [ids.NodesCount, true],
            [ids.GroupsCount, true],
            [ids.State, true],
            [ids.CPU, true],
            [ids.AllocatedCPU, true],
            [ids.AllocatedMemory, true],
        ]);
    });
});

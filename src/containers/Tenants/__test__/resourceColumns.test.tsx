import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {DATABASES_COLUMNS_IDS as ids} from '../constants';
import {
    getMyDatabasesColumns,
    getTotalsRow,
    groupResourceColumns,
    ungroupResourceColumns,
} from '../resourceColumns';
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
        const total = totals?.[ids.AllocatedCPU];
        render(<ThemeProvider>{total}</ThemeProvider>);

        expect(screen.getByText('≥ 4')).toBeInTheDocument();
        // The database without its own compute is not one of the two
        expect(React.isValidElement<{content: string}>(total) && total.props.content).toBe(
            'Sum for 1 of 2 databases. The remaining values are unknown.',
        );
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

describe('getMyDatabasesColumns', () => {
    const clusterTableColumns = [
        ids.Name,
        ids.Type,
        ids.State,
        ids.BridgeMode,
        ids.BridgeSyncStatus,
        ids.CPU,
        ids.Memory,
        ids.Storage,
        ids.Network,
        ids.NodesCount,
        ids.GroupsCount,
    ].map((name): Column<DatabaseRow> => ({name, render: () => name}));
    const names = (withAllocatedResources: boolean) =>
        getMyDatabasesColumns(clusterTableColumns, {withAllocatedResources}).map(({name}) => name);

    test('puts column groups after the state and drops the storage column', () => {
        expect(names(true)).toEqual([
            ids.Name,
            ids.Type,
            ids.State,
            ids.AllocatedCPU,
            ids.AllocatedMemory,
            ids.NodesCount,
            ids.GroupsCount,
            ids.BridgeMode,
            ids.BridgeSyncStatus,
            ids.CPU,
            ids.Memory,
            ids.Network,
        ]);
    });

    test('has no allocated columns when their presets cannot be loaded', () => {
        expect(names(false)).not.toContain(ids.AllocatedCPU);
        expect(names(false)).not.toContain(ids.AllocatedMemory);
    });
});

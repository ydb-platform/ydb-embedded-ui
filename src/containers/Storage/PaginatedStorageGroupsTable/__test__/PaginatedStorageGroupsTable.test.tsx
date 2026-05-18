import React from 'react';

import {render} from '@testing-library/react';

import type {ResizeablePaginatedTable} from '../../../../components/PaginatedTable';
import {PaginatedStorageGroupsTable} from '../PaginatedStorageGroupsTable';
import {STORAGE_GROUPS_COLUMNS_IDS} from '../columns/constants';
import type {StorageGroupsColumn} from '../columns/types';

jest.mock('../../../../components/PaginatedTable', () => ({
    PAGINATED_TABLE_IDS: {STORAGE_GROUPS: 'storage-groups'},
    ResizeablePaginatedTable: jest.fn(() => null),
}));

jest.mock('../../../../components/LoaderWrapper/LoaderWrapper', () => ({
    LoaderWrapper: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useCapabilitiesLoaded: jest.fn(() => true),
    useStorageGroupsHandlerAvailable: jest.fn(() => true),
}));

jest.mock('../getGroups', () => ({
    useGroupsGetter: jest.fn(() => jest.fn()),
}));

const ResizeablePaginatedTableMock = jest.requireMock('../../../../components/PaginatedTable')
    .ResizeablePaginatedTable as jest.MockedFunction<typeof ResizeablePaginatedTable>;

const defaultProps = {
    searchValue: '',
    visibleEntities: 'all' as const,
    onShowAll: jest.fn(),
    scrollContainerRef: React.createRef<HTMLElement>(),
    renderErrorMessage: jest.fn(),
};

function renderTable(columns: StorageGroupsColumn[]) {
    render(<PaginatedStorageGroupsTable {...defaultProps} columns={columns} />);
}

describe('PaginatedStorageGroupsTable', () => {
    beforeEach(() => {
        ResizeablePaginatedTableMock.mockClear();
    });

    test('passes larger row height and class when VDisks column is visible', () => {
        renderTable([{name: STORAGE_GROUPS_COLUMNS_IDS.VDisks} as StorageGroupsColumn]);

        expect(ResizeablePaginatedTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                rowHeight: 46,
                extraContainerClassName: 'ydb-storage-groups-table_with-vdisks',
            }),
            {},
        );
    });

    test('passes larger row height and class when VDisksPDisks column is visible', () => {
        renderTable([{name: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks} as StorageGroupsColumn]);

        expect(ResizeablePaginatedTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                rowHeight: 46,
                extraContainerClassName: 'ydb-storage-groups-table_with-vdisks',
            }),
            {},
        );
    });

    test('does not override row height or class without VDisks columns', () => {
        renderTable([{name: STORAGE_GROUPS_COLUMNS_IDS.GroupId} as StorageGroupsColumn]);

        expect(ResizeablePaginatedTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                rowHeight: undefined,
                extraContainerClassName: undefined,
            }),
            {},
        );
    });
});

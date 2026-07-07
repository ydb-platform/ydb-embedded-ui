import React from 'react';

import {render, screen} from '@testing-library/react';

import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {STORAGE_GROUPS_COLUMNS_IDS} from '../../PaginatedStorageGroupsTable/columns/constants';
import type {StorageGroupsColumn} from '../../PaginatedStorageGroupsTable/columns/types';
import {StorageGroupsControls} from '../StorageGroupsControls';

jest.mock('@gravity-ui/uikit', () => ({
    Button: ({children}: {children: React.ReactNode}) => <button>{children}</button>,
    Flex: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    Icon: () => null,
    Select: () => null,
    Text: ({children}: {children: React.ReactNode}) => <span>{children}</span>,
}));

jest.mock('../../../../components/EntitiesCount/EntitiesCount', () => ({
    EntitiesCount: () => null,
}));

jest.mock('../../../../components/Search/Search', () => ({
    Search: () => null,
}));

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
    useBridgeModeEnabled: jest.fn(),
}));

jest.mock('../../../../utils/hooks', () => ({
    useSetting: jest.fn(),
}));

jest.mock('../../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: jest.fn(),
}));

jest.mock('../../StorageExpertModePanel/StorageExpertModePanel', () => ({
    StorageExpertModePanel: () => <div>storage expert panel</div>,
}));

jest.mock('../../StorageTypeFilter/StorageTypeFilter', () => ({
    StorageTypeFilter: () => null,
}));

jest.mock('../../StorageVisibleEntitiesFilter/StorageVisibleEntitiesFilter', () => ({
    StorageVisibleEntitiesFilter: () => null,
}));

jest.mock('../../i18n', () => (key: string) => key);

jest.mock('../../useStorageQueryParams', () => ({
    useIsStorageExpertMode: jest.fn(),
    useStorageQueryParams: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled, useBridgeModeEnabled} = jest.requireMock(
    '../../../../store/reducers/capabilities/hooks',
);
const {useSetting} = jest.requireMock('../../../../utils/hooks');
const {useIsUserAllowedToMakeChanges} = jest.requireMock(
    '../../../../utils/hooks/useIsUserAllowedToMakeChanges',
);
const {useIsStorageExpertMode, useStorageQueryParams} = jest.requireMock(
    '../../useStorageQueryParams',
);

describe('StorageGroupsControls', () => {
    const handleStorageExpertModeChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        useBridgeModeEnabled.mockReturnValue(false);
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
        useSetting.mockImplementation((key: string) => [
            key === SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE,
            jest.fn(),
        ]);
        useIsUserAllowedToMakeChanges.mockReturnValue(true);
        useIsStorageExpertMode.mockReturnValue(false);
        useStorageQueryParams.mockReturnValue({
            groupsSearchValue: '',
            storageType: 'groups',
            visibleEntities: 'all',
            storageGroupsGroupByParam: undefined,
            handleTextFilterGroupsChange: jest.fn(),
            handleStorageTypeChange: jest.fn(),
            handleVisibleEntitiesChange: jest.fn(),
            handleStorageGroupsGroupByParamChange: jest.fn(),
            handleStorageExpertModeChange,
        });
    });

    test('hides expert mode controls when saved expert mode is enabled but user cannot see replacement column', () => {
        useIsUserAllowedToMakeChanges.mockReturnValue(false);
        useIsStorageExpertMode.mockReturnValue(true);

        render(
            <StorageGroupsControls
                columns={[{name: STORAGE_GROUPS_COLUMNS_IDS.VDisks} as StorageGroupsColumn]}
                entitiesCountCurrent={0}
                entitiesLoading={false}
            />,
        );

        expect(
            screen.queryByRole('button', {name: 'controls_expert-mode'}),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('storage expert panel')).not.toBeInTheDocument();
    });

    test('shows expert mode controls when the user can see replacement column', () => {
        render(
            <StorageGroupsControls
                columns={[{name: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks} as StorageGroupsColumn]}
                entitiesCountCurrent={0}
                entitiesLoading={false}
            />,
        );

        expect(screen.getByRole('button', {name: 'controls_expert-mode'})).toBeInTheDocument();
    });
});

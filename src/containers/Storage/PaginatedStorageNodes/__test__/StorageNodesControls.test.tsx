import {render, screen} from '@testing-library/react';

import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {StorageNodesControls} from '../StorageNodesControls';

jest.mock('@gravity-ui/uikit', () => ({
    Button: ({children}: {children: React.ReactNode}) => <button>{children}</button>,
    Flex: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    Icon: () => null,
    Select: () => null,
    Text: ({children}: {children: React.ReactNode}) => <span>{children}</span>,
}));

jest.mock('../../../../components/EntitiesCount/EntitiesCount', () => ({
    EntitiesCount: () => <span>nodes count</span>,
}));

jest.mock('../../../../components/HideUnavailableNodesSwitch/HideUnavailableNodesSwitch', () => ({
    HideUnavailableNodesSwitch: () => <span>hide unavailable</span>,
}));

jest.mock('../../../../components/PaginatedTable/PaginatedTableContext', () => ({
    usePaginatedTableState: jest.fn(),
}));

jest.mock('../../../../components/Search/Search', () => ({
    Search: () => null,
}));

jest.mock('../../../../components/UptimeFIlter', () => ({
    UptimeFilter: () => null,
}));

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useBlobStorageCapacityMetricsAvailable: jest.fn(() => true),
    useBlobStorageCapacityMetricsEnabled: jest.fn(() => false),
}));

jest.mock('../../../../utils/hooks', () => ({
    useSetting: jest.fn(),
}));

jest.mock('../../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: jest.fn(() => true),
}));

jest.mock('../../PaginatedStorageNodesTable/columns/constants', () => ({
    getStorageNodesGroupByOptions: jest.fn(() => []),
}));

jest.mock('../../StorageExpertModePanel/StorageNodesExpertModePanel', () => ({
    StorageNodesExpertModePanel: () => null,
}));

jest.mock('../../StorageTypeFilter/StorageTypeFilter', () => ({
    StorageTypeFilter: () => null,
}));

jest.mock('../../StorageVisibleEntitiesFilter/StorageVisibleEntitiesFilter', () => ({
    StorageVisibleEntitiesFilter: () => null,
}));

jest.mock('../../i18n', () => (key: string) => key);

jest.mock('../../useStorageQueryParams', () => ({
    useIsStorageExpertMode: jest.fn(() => false),
    useStorageQueryParams: jest.fn(() => ({
        nodesSearchValue: '',
        storageType: 'nodes',
        visibleEntities: 'all',
        nodesUptimeFilter: 'All',
        storageNodesGroupByParam: undefined,
        handleTextFilterNodesChange: jest.fn(),
        handleStorageTypeChange: jest.fn(),
        handleVisibleEntitiesChange: jest.fn(),
        handleUptimeFilterChange: jest.fn(),
        handleStorageNodesGroupByParamChange: jest.fn(),
        handleStorageExpertModeChange: jest.fn(),
    })),
}));

const {useSetting} = jest.requireMock('../../../../utils/hooks');

describe('StorageNodesControls', () => {
    beforeEach(() => {
        useSetting.mockImplementation((key: string) => [
            key === SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE,
            jest.fn(),
        ]);
    });

    test('puts the data issues indicator last in the row, after the expert mode button', () => {
        render(
            <StorageNodesControls
                withTypeSelector
                entitiesCountCurrent={0}
                entitiesLoading={false}
                dataIssuesIndicator={<span>data may be incomplete</span>}
            />,
        );

        const indicator = screen.getByText('data may be incomplete');
        const rowItems = Array.from(indicator.parentElement?.children ?? []);
        const expertMode = screen.getByRole('button', {name: 'controls_expert-mode'});

        expect(rowItems.at(-1)).toBe(indicator);
        expect(rowItems.indexOf(indicator)).toBeGreaterThan(rowItems.indexOf(expertMode));
        expect(rowItems.indexOf(indicator)).toBeGreaterThan(
            rowItems.indexOf(screen.getByText('hide unavailable')),
        );
        expect(rowItems.indexOf(indicator)).toBeGreaterThan(
            rowItems.indexOf(screen.getByText('nodes count')),
        );
    });
});

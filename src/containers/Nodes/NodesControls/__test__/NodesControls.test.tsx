import {render, screen} from '@testing-library/react';

import {NodesControls} from '../NodesControls';

jest.mock('@gravity-ui/uikit', () => ({
    Select: () => null,
    Text: ({children}: {children: React.ReactNode}) => <span>{children}</span>,
}));

jest.mock('../../../../components/EntitiesCount', () => ({
    EntitiesCount: () => <span>nodes count</span>,
}));

jest.mock('../../../../components/HideUnavailableNodesSwitch/HideUnavailableNodesSwitch', () => ({
    HideUnavailableNodesSwitch: () => <span>hide unavailable</span>,
}));

jest.mock('../../../../components/ProblemFilter/ProblemFilter', () => ({
    ProblemFilter: () => null,
}));

jest.mock('../../../../components/Search', () => ({
    Search: () => null,
}));

jest.mock('../../../../components/UptimeFIlter', () => ({
    UptimeFilter: () => null,
}));

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useViewerNodesHandlerHasGroupingBySystemState: jest.fn(() => true),
    useViewerNodesHandlerHasNetworkStats: jest.fn(() => true),
}));

jest.mock('../../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: jest.fn(() => true),
}));

jest.mock('../../PeerRoleFilter/PeerRoleFilter', () => ({
    PeerRoleFilter: () => null,
}));

jest.mock('../../columns/constants', () => ({
    getNodesGroupByOptions: jest.fn(() => []),
}));

jest.mock('../../i18n', () => (key: string) => key);

jest.mock('../../useNodesPageQueryParams', () => ({
    useNodesPageQueryParams: jest.fn(() => ({
        searchValue: '',
        uptimeFilter: 'All',
        peerRoleFilter: undefined,
        groupByParam: undefined,
        withProblems: false,
        handleSearchQueryChange: jest.fn(),
        handleUptimeFilterChange: jest.fn(),
        handlePeerRoleFilterChange: jest.fn(),
        handleGroupByParamChange: jest.fn(),
        handleWithProblemsChange: jest.fn(),
    })),
}));

describe('NodesControls', () => {
    test('puts the data issues indicator last in the row', () => {
        render(
            <div data-testid="row">
                <NodesControls
                    withGroupBySelect
                    withPeerRoleFilter
                    groupByParams={undefined}
                    entitiesCountCurrent={0}
                    entitiesLoading={false}
                    dataIssuesIndicator={<span>data may be incomplete</span>}
                />
            </div>,
        );

        const rowItems = Array.from(screen.getByTestId('row').children);
        const indicator = screen.getByText('data may be incomplete');

        expect(rowItems.at(-1)).toBe(indicator);
        expect(rowItems.indexOf(indicator)).toBeGreaterThan(
            rowItems.indexOf(screen.getByText('nodes count')),
        );
        expect(rowItems.indexOf(indicator)).toBeGreaterThan(
            rowItems.indexOf(screen.getByText('hide unavailable')),
        );
    });
});

import {renderHook} from '@testing-library/react';

import {SelfCheckResult} from '../../../../types/api/healthcheck';
import {useHealthcheck} from '../useHealthcheck';

const mockUseGetHealthcheckInfoQuery = jest.fn();
const mockSelectLeavesIssues = jest.fn();
const mockUseTenantBaseInfo = jest.fn();

jest.mock('../../../../store/reducers/healthcheckInfo/healthcheckInfo', () => ({
    healthcheckApi: {
        useGetHealthcheckInfoQuery: (...args: unknown[]) => mockUseGetHealthcheckInfoQuery(...args),
    },
    selectLeavesIssues: (...args: unknown[]) => mockSelectLeavesIssues(...args),
}));

jest.mock('../../../../store/reducers/tenant/tenant', () => ({
    useTenantBaseInfo: (...args: unknown[]) => mockUseTenantBaseInfo(...args),
}));

jest.mock('../../../../utils/hooks', () => ({
    useTypedSelector: (selector: (state: object) => unknown) => selector({}),
}));

describe('useHealthcheck', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseGetHealthcheckInfoQuery.mockReturnValue({
            currentData: {self_check_result: SelfCheckResult.GOOD},
            isFetching: false,
            error: undefined,
            refetch: jest.fn(),
            fulfilledTimeStamp: 1,
        });
        mockSelectLeavesIssues.mockReturnValue([]);
        mockUseTenantBaseInfo.mockReturnValue({databaseType: 'Dedicated'});
    });

    test('uses list data without a tenant lookup and scopes healthcheck state by cluster', () => {
        renderHook(() =>
            useHealthcheck('/Root/database', {
                clusterName: 'test-cluster',
                databaseType: 'Dedicated',
            }),
        );

        expect(mockUseTenantBaseInfo).toHaveBeenCalledWith('/Root/database', 'test-cluster', {
            skip: true,
        });
        expect(mockUseGetHealthcheckInfoQuery).toHaveBeenCalledWith(
            {database: '/Root/database', clusterName: 'test-cluster'},
            {pollingInterval: undefined, skip: false},
        );
        expect(mockSelectLeavesIssues).toHaveBeenCalledWith({}, '/Root/database', 'test-cluster');
    });

    test('skips the healthcheck request for a supplied Serverless database', () => {
        renderHook(() =>
            useHealthcheck('/Root/database', {
                clusterName: 'test-cluster',
                databaseType: 'Serverless',
            }),
        );

        expect(mockUseGetHealthcheckInfoQuery).toHaveBeenCalledWith(
            {database: '/Root/database', clusterName: 'test-cluster'},
            {pollingInterval: undefined, skip: true},
        );
    });
});

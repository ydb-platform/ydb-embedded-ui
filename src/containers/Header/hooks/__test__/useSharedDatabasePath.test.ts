import {renderHook} from '@testing-library/react';

import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {tenantsApi} from '../../../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../../../store/reducers/tenants/types';
import {configureUIFactory} from '../../../../uiFactory/uiFactory';
import {useDatabasesV2} from '../../../../utils/hooks/useDatabasesV2';
import {useAdditionalTenantsProps} from '../../../AppWithClusters/utils/useAdditionalTenantsProps';
import {useSharedDatabasePath} from '../useSharedDatabasePath';

jest.mock('../../../../store', () => ({
    backend: undefined,
    basename: '/monitoring',
    clusterName: undefined,
    environment: 'cloud-prod',
    webVersion: true,
}));

jest.mock('../../../../store/reducers/cluster/cluster', () => ({
    useClusterBaseInfo: jest.fn(),
}));

jest.mock('../../../../store/reducers/tenants/tenants', () => ({
    tenantsApi: {useGetTenantsInfoQuery: jest.fn()},
}));

jest.mock('../../../../utils/hooks/useDatabasesV2', () => ({
    useDatabasesV2: jest.fn(),
}));

jest.mock('../../../AppWithClusters/utils/useAdditionalTenantsProps', () => ({
    useAdditionalTenantsProps: jest.fn(),
}));

const databaseData = {
    Type: 'Serverless',
    ResourceId: 'resource-id',
    NodeIds: [42],
    sharedNodeIds: [84],
    sharedTenantName: undefined,
} as PreparedTenant;

describe('useSharedDatabasePath', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        configureUIFactory({useDatabaseId: true});
        (useDatabasesV2 as jest.Mock).mockReturnValue(true);
        (useClusterBaseInfo as jest.Mock).mockReturnValue({
            settings: {use_meta_proxy: false},
            isResolved: true,
        });
        (tenantsApi.useGetTenantsInfoQuery as jest.Mock).mockReturnValue({
            currentData: [{Id: 'resource-id', Name: 'shared-name'}],
        });
        (useAdditionalTenantsProps as jest.Mock).mockReturnValue({
            prepareTenantBackend: (nodeId?: string | number) =>
                nodeId === '42' ? 'https://node-42.example.test/viewer' : undefined,
        });
    });

    afterEach(() => {
        configureUIFactory({useDatabaseId: false});
    });

    test('uses the same tenant backend calculation as the databases list', () => {
        const {result} = renderHook(() =>
            useSharedDatabasePath({
                clusterName: 'cluster',
                databaseData,
                isViewerUser: true,
            }),
        );

        expect(result.current).toBe(
            '/monitoring/cloud-prod/database?clusterName=cluster&database=shared-name&backend=https%3A%2F%2Fnode-42.example.test%2Fviewer',
        );
    });

    test('resolves a missing shared database name within the current environment', () => {
        configureUIFactory({useDatabaseId: false});
        (useClusterBaseInfo as jest.Mock).mockReturnValue({
            settings: {use_meta_proxy: true},
            isResolved: true,
        });
        (tenantsApi.useGetTenantsInfoQuery as jest.Mock).mockImplementation(
            ({environmentName}: {environmentName?: string}) => ({
                currentData:
                    environmentName === 'cloud-prod'
                        ? [{Id: 'resource-id', Name: 'environment-shared-name'}]
                        : [],
            }),
        );

        const {result} = renderHook(() =>
            useSharedDatabasePath({
                clusterName: 'cluster',
                databaseData,
                isViewerUser: true,
            }),
        );

        expect(result.current).toBe(
            '/monitoring/cloud-prod/database?clusterName=cluster&database=environment-shared-name&backend=https%3A%2F%2Fnode-42.example.test%2Fviewer',
        );
    });
});

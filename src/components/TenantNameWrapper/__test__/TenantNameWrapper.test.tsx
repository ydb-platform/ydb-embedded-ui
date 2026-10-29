import {render, screen} from '@testing-library/react';

import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {TenantNameWrapper} from '../TenantNameWrapper';
import {getTenantLink} from '../utils';

jest.mock('../../../routes', () => ({
    getTenantPath: (params: Record<string, string>) =>
        `/database?${new URLSearchParams(params).toString()}`,
}));
jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useEmMetaAvailable: () => false,
}));
jest.mock('../../../store/reducers/cluster/cluster', () => ({
    useClusterBaseInfo: () => ({settings: {use_meta_proxy: false}}),
}));
jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: () => false,
}));
jest.mock('../../../utils/clusterLinks/useDatabaseLinks', () => ({
    useDatabaseLinks: () => [],
}));
jest.mock('../../DropdownMenu', () => ({DropdownMenu: () => null}));
jest.mock('../../ConnectToDB/ConnectToDBDialog', () => ({getConnectToDBDialog: jest.fn()}));

afterEach(() => jest.restoreAllMocks());

test('uses the resolved link without choosing another backend on render', () => {
    const tenant: PreparedTenant = {
        Name: '/cluster/database',
        Cluster: 'cluster',
        NodeIds: [123, 456],
        controlPlaneName: 'database',
        sharedTenantName: undefined,
        sharedNodeIds: undefined,
        cpu: undefined,
        memory: undefined,
        storage: undefined,
        nodesCount: 2,
        groupsCount: 0,
    };
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const prepareTenantBackend = jest.fn(
        (nodeId?: string | number) => `https://balancer.test/node/${nodeId}`,
    );
    const additionalTenantsProps = {prepareTenantBackend};
    const link = getTenantLink({tenant, additionalTenantsProps});
    expect(new URL(link.href, 'https://ui.test').searchParams.get('backend')).toBe(
        'https://balancer.test/node/123',
    );

    jest.mocked(Math.random).mockReturnValue(0.99);
    const {rerender} = render(
        <TenantNameWrapper
            tenant={tenant}
            additionalTenantsProps={additionalTenantsProps}
            link={link}
        />,
    );
    expect(screen.getByRole('link', {name: 'database'})).toHaveAttribute('href', link.href);
    expect(screen.getByRole('link', {name: 'database'})).toHaveAttribute('target', '_blank');

    rerender(
        <TenantNameWrapper
            tenant={{...tenant}}
            additionalTenantsProps={additionalTenantsProps}
            link={link}
        />,
    );
    expect(screen.getByRole('link', {name: 'database'})).toHaveAttribute('href', link.href);
    expect(prepareTenantBackend).toHaveBeenCalledTimes(1);
});

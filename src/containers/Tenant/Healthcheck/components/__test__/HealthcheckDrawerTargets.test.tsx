import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';

import type {PreparedTenant} from '../../../../../store/reducers/tenants/types';
import {ClusterDrawerHealthcheck as ClusterPageDrawer} from '../../../../Cluster/ClusterDrawerHealthcheck';
import {ClusterDrawerHealthcheck as ClustersDrawer} from '../../../../Clusters/ClusterDrawerHealthcheck';
import {DatabaseDrawerHealthcheck} from '../../../../Tenants/DatabaseDrawerHealthcheck';
import {TenantDrawerHealthcheck} from '../../../TenantDrawerHealthcheck';
import type {HealthcheckAssistantTarget} from '../../types';
import {HealthcheckDrawer} from '../HealthcheckDrawer';

jest.mock('../HealthcheckDrawer', () => ({
    HealthcheckDrawer: jest.fn(({children}: {children: React.ReactNode}) => children),
}));
jest.mock('../../../../../utils/hooks', () => ({useTypedSelector: () => undefined}));
jest.mock('../../../TenantContext', () => ({useCurrentSchema: () => ({database: '/Root/db'})}));
jest.mock('../../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        showHealthcheck: true,
        handleShowHealthcheckChange: jest.fn(),
        handleIssuesFilterChange: jest.fn(),
        handleHealthcheckViewChange: jest.fn(),
    }),
}));
jest.mock('use-query-params', () => ({
    BooleanParam: {},
    StringParam: {},
    useQueryParams: () => [{showHealthcheck: true}, jest.fn()],
}));
jest.mock('../../Healthcheck', () => ({Healthcheck: () => null}));

const tenant: PreparedTenant = {
    Name: '/Root/db',
    Cluster: 'tenant-cluster',
    Type: 'Dedicated',
    sharedTenantName: undefined,
    sharedNodeIds: undefined,
    controlPlaneName: '',
    cpu: undefined,
    memory: undefined,
    storage: undefined,
    nodesCount: 0,
    groupsCount: 0,
};

describe('Healthcheck drawer target owners', () => {
    beforeEach(() => jest.clearAllMocks());

    test.each<[string, React.ReactElement, HealthcheckAssistantTarget]>([
        [
            'all clusters',
            <ClustersDrawer clusterName="alpha" isVisible onClose={jest.fn()} children={null} />,
            {scope: 'cluster', request: {clusterName: 'alpha'}},
        ],
        [
            'cluster page',
            <ClusterPageDrawer clusterName="alpha" database="/Root" children={null} />,
            {scope: 'cluster', request: {clusterName: 'alpha', database: '/Root'}},
        ],
        [
            'database page',
            <TenantDrawerHealthcheck clusterName="alpha" children={null} />,
            {scope: 'database', request: {clusterName: 'alpha', database: '/Root/db'}},
        ],
    ])('passes the %s target before data resolves', (_name, element, target) => {
        render(element);
        expect(jest.mocked(HealthcheckDrawer).mock.lastCall?.[0].target).toEqual(target);
    });

    test.each([undefined, 'explicit-cluster'])(
        'database list uses selected identity, with explicit cluster %s',
        (clusterName) => {
            render(
                <DatabaseDrawerHealthcheck clusterName={clusterName}>
                    {(onStatusClick) => (
                        <button onClick={() => onStatusClick(tenant, '/Root/db')}>
                            Open healthcheck
                        </button>
                    )}
                </DatabaseDrawerHealthcheck>,
            );
            fireEvent.click(screen.getByRole('button', {name: 'Open healthcheck'}));
            expect(jest.mocked(HealthcheckDrawer).mock.lastCall?.[0].target).toEqual({
                scope: 'database',
                request: {database: '/Root/db', clusterName: clusterName ?? 'tenant-cluster'},
            });
        },
    );
});

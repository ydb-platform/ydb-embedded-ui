import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';

import type {PreparedTenant} from '../../../../../store/reducers/tenants/types';
import {configureUIFactory, uiFactory} from '../../../../../uiFactory/uiFactory';
import {ClusterDrawerHealthcheck as ClusterPageDrawer} from '../../../../Cluster/ClusterDrawerHealthcheck';
import {ClusterDrawerHealthcheck as ClustersDrawer} from '../../../../Clusters/ClusterDrawerHealthcheck';
import {DatabaseDrawerHealthcheck} from '../../../../Tenants/DatabaseDrawerHealthcheck';
import {TenantDrawerHealthcheck} from '../../../TenantDrawerHealthcheck';
import type {HealthcheckAssistantTarget} from '../../types';

jest.mock('../../../../../components/Drawer', () => ({
    DrawerWrapper: ({
        isDrawerVisible,
        renderDrawerContent,
        children,
    }: {
        isDrawerVisible: boolean;
        renderDrawerContent: () => React.ReactNode;
        children: React.ReactNode;
    }) => (
        <div>
            {children}
            {isDrawerVisible && renderDrawerContent()}
        </div>
    ),
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
jest.mock('../../Healthcheck', () => ({Healthcheck: () => <div>Loading healthcheck</div>}));

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
    const originalExtension = uiFactory.healthcheck.renderDrawerExtension;
    const targets = jest.fn();
    beforeEach(() => {
        targets.mockClear();
        configureUIFactory({
            healthcheck: {
                renderDrawerExtension: (props) => {
                    targets(props?.target);
                    return null;
                },
            },
        });
    });
    afterEach(() => configureUIFactory({healthcheck: {renderDrawerExtension: originalExtension}}));

    test.each<{name: string; element: React.ReactElement; target: HealthcheckAssistantTarget}>([
        {
            name: 'all clusters',
            element: (
                <ClustersDrawer clusterName="alpha" isVisible onClose={jest.fn()}>
                    Page
                </ClustersDrawer>
            ),
            target: {scope: 'cluster', request: {clusterName: 'alpha'}},
        },
        {
            name: 'cluster page',
            element: (
                <ClusterPageDrawer clusterName="alpha" database="/Root">
                    Page
                </ClusterPageDrawer>
            ),
            target: {scope: 'cluster', request: {clusterName: 'alpha', database: '/Root'}},
        },
        {
            name: 'database page',
            element: <TenantDrawerHealthcheck clusterName="alpha">Page</TenantDrawerHealthcheck>,
            target: {scope: 'database', request: {clusterName: 'alpha', database: '/Root/db'}},
        },
    ])('provides $name identity before data resolves', ({element, target}) => {
        render(element);
        expect(targets).toHaveBeenLastCalledWith(target);
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
            expect(targets).not.toHaveBeenCalled();
            fireEvent.click(screen.getByRole('button', {name: 'Open healthcheck'}));
            expect(targets).toHaveBeenLastCalledWith({
                scope: 'database',
                request: {database: '/Root/db', clusterName: clusterName ?? 'tenant-cluster'},
            });
        },
    );
});

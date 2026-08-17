import type {YDBDefinitionListItem} from '../../components/YDBDefinitionList/YDBDefinitionList';
import {
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
    isIssueTypeOfCategory,
    issueCategories,
} from '../../containers/Tenant/Healthcheck/shared';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {UIFactory} from '../types';

test('allows consumers to omit the defaulted maximum VDisk count', () => {
    const factory: UIFactory = {
        healthcheck: {
            issueCategories,
            isIssueTypeOfCategory,
            getHealthckechViewTitles,
            getHealthcheckViewsOrder,
        },
        hasAccess: () => true,
    };

    expect(factory.maxVDisksInStorageGroup).toBeUndefined();
});

test('supports additional database info items built from prepared tenant data', () => {
    const databaseData: PreparedTenant = {
        sharedTenantName: undefined,
        sharedNodeIds: undefined,
        controlPlaneName: 'database',
        cpu: undefined,
        memory: undefined,
        storage: undefined,
        nodesCount: 0,
        groupsCount: 0,
        UserAttributes: {
            cloud_id: 'cloud-id',
        },
    };
    const expectedItems: YDBDefinitionListItem[] = [
        {
            name: 'Cloud ID',
            content: 'cloud-id',
            copyText: 'cloud-id',
        },
    ];
    const factory: UIFactory = {
        healthcheck: {
            issueCategories,
            isIssueTypeOfCategory,
            getHealthckechViewTitles,
            getHealthcheckViewsOrder,
        },
        hasAccess: () => true,
        getAdditionalDatabaseInfoItems: ({databaseData: value}) => [
            {
                name: 'Cloud ID',
                content: value.UserAttributes?.cloud_id,
                copyText: value.UserAttributes?.cloud_id,
            },
        ],
    };

    expect(factory.getAdditionalDatabaseInfoItems?.({databaseData})).toEqual(expectedItems);
});

import {
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
    isIssueTypeOfCategory,
    issueCategories,
} from '../../containers/Tenant/Healthcheck/shared';
import type {CreateGraphLayoutWorker, GetAdditionalDatabaseInfoItems} from '../../lib';
import type {UIFactory} from '../types';
import {configureUIFactory, uiFactory} from '../uiFactory';

afterEach(() => {
    configureUIFactory({
        createGraphLayoutWorker: undefined,
        getAdditionalDatabaseInfoItems: undefined,
    });
});

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
    const databaseData: Parameters<GetAdditionalDatabaseInfoItems>[0]['databaseData'] = {
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
    const getAdditionalDatabaseInfoItems: GetAdditionalDatabaseInfoItems = ({
        databaseData: value,
    }) => [
        {
            name: 'Cloud ID',
            content: value.UserAttributes?.cloud_id,
            copyText: value.UserAttributes?.cloud_id,
        },
    ];

    configureUIFactory({getAdditionalDatabaseInfoItems});

    expect(uiFactory.getAdditionalDatabaseInfoItems?.({databaseData})).toEqual([
        {
            name: 'Cloud ID',
            content: 'cloud-id',
            copyText: 'cloud-id',
        },
    ]);
});

test('supports a custom graph layout worker factory', () => {
    const worker = {} as Worker;
    const createGraphLayoutWorker: CreateGraphLayoutWorker = () => worker;

    configureUIFactory({createGraphLayoutWorker});

    expect(uiFactory.createGraphLayoutWorker?.()).toBe(worker);
});

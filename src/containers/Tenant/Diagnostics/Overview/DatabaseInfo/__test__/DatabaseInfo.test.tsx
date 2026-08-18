import {render, screen} from '@testing-library/react';

import type {GetAdditionalDatabaseInfoItems} from '../../../../../../lib';
import {configureUIFactory} from '../../../../../../uiFactory/uiFactory';
import {DatabaseInfo} from '../DatabaseInfo';

type DatabaseData = Parameters<GetAdditionalDatabaseInfoItems>[0]['databaseData'];

let mockDatabaseData: DatabaseData | undefined;

jest.mock('../../../../../../store/reducers/tenant/tenant', () => ({
    useTenantBaseInfo: () => ({databaseData: mockDatabaseData}),
}));

jest.mock('../../../../../../utils/hooks/useWhoami', () => ({
    useUserPermissions: () => undefined,
}));

const getAdditionalDatabaseInfoItems: GetAdditionalDatabaseInfoItems = ({databaseData}) => [
    {
        name: 'Cloud ID',
        content: databaseData.UserAttributes?.cloud_id,
        copyText: databaseData.UserAttributes?.cloud_id,
    },
];

function prepareDatabaseData(userAttributes?: DatabaseData['UserAttributes']): DatabaseData {
    return {
        sharedTenantName: undefined,
        sharedNodeIds: undefined,
        controlPlaneName: 'database',
        cpu: undefined,
        memory: undefined,
        storage: undefined,
        nodesCount: 0,
        groupsCount: 0,
        UserAttributes: userAttributes,
    };
}

describe('DatabaseInfo additional items', () => {
    beforeEach(() => {
        configureUIFactory({getAdditionalDatabaseInfoItems});
    });

    afterEach(() => {
        configureUIFactory({getAdditionalDatabaseInfoItems: undefined});
    });

    test('renders an additional item derived from database attributes', () => {
        mockDatabaseData = prepareDatabaseData({cloud_id: 'cloud-id'});

        render(<DatabaseInfo path="/Root/database" database="/Root/database" />);

        expect(screen.getByText('Cloud ID')).toBeVisible();
        expect(screen.getByText('cloud-id')).toBeVisible();
    });

    test('omits an additional item when its database attribute is absent', () => {
        mockDatabaseData = prepareDatabaseData();

        render(<DatabaseInfo path="/Root/database" database="/Root/database" />);

        expect(screen.queryByText('Cloud ID')).not.toBeInTheDocument();
    });
});

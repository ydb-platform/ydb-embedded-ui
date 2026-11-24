import React from 'react';

import {Link} from '@gravity-ui/uikit';
import ReactDOM from 'react-dom/client';

import type {MyDatabasesTableColumn, MyDatabasesTableExtensionProps} from '../../src/lib';
import {MultiClusterApp} from '../../src/lib';
import {configureStore} from '../../src/store';
import {configureUIFactory} from '../../src/uiFactory/uiFactory';

import '../../src/styles/index.scss';

const TEST_DATABASES_COLUMNS: MyDatabasesTableColumn[] = [
    {
        name: 'test-owner',
        settingsTitle: 'Test owner',
        header: 'Owner',
        after: 'cpu',
        visibleByDefault: true,
        render: ({row}) => row.Owner,
    },
];

function TestDatabasesExtension({rows, environmentName, children}: MyDatabasesTableExtensionProps) {
    const [grouped, setGrouped] = React.useState(false);
    return children({
        controls: (
            <button onClick={() => setGrouped(!grouped)}>
                {grouped ? 'Clear grouping' : `Group databases in ${environmentName}`}
            </button>
        ),
        additionalColumns: TEST_DATABASES_COLUMNS,
        groups: grouped
            ? ['alpha', 'beta']
                  .map((cluster) => ({
                      id: cluster,
                      title: `Cluster ${cluster}`,
                      rows: rows.filter((row) => row.Cluster === cluster),
                  }))
                  .filter((group) => group.rows.length > 0)
            : undefined,
    });
}

const databasesFixture = new URLSearchParams(window.location.search);
configureUIFactory({
    databasesEnvironmentsConfig: databasesFixture.has('databasesFixture')
        ? {getSupportedEnvironments: () => ['env-a'], getEnvironments: () => ['env-a']}
        : undefined,
    MyDatabasesTableExtension: databasesFixture.has('withExtension')
        ? TestDatabasesExtension
        : undefined,
    emMetaAvailable: true,
    resolveUser: new URLSearchParams(window.location.search).has('resolveUsers')
        ? ({userId}) => <Link href={`/accounts/${userId}`}>user@example.test</Link>
        : undefined,
    hideNewFeaturesNotifications: {navigationV2: true},
});

const {store, history} = configureStore({environments: ['env-a', 'env-b']});

declare global {
    interface Window {
        controlPlaneTest: {navigate: (path: string) => void};
    }
}

window.controlPlaneTest = {navigate: (path) => history.push(path)};

const root = document.getElementById('root');
if (!root) {
    throw new Error('Missing root');
}
ReactDOM.createRoot(root).render(<MultiClusterApp store={store} history={history} />);

import ReactDOM from 'react-dom/client';

import {MultiClusterApp} from '../../src/lib';
import {configureStore} from '../../src/store';
import {authenticationApi} from '../../src/store/reducers/authentication/authentication';
import {useClusterBaseInfo} from '../../src/store/reducers/cluster/cluster';
import {tenantApi} from '../../src/store/reducers/tenant/tenant';
import {configureUIFactory} from '../../src/uiFactory/uiFactory';
import {useDatabasesV2} from '../../src/utils/hooks/useDatabasesV2';

import '../../src/styles/index.scss';

// Mirrors package consumers that read tenant data with the original query arguments.
function ExternalExtension({database, kind}: {database: string; kind: string}) {
    const {name: clusterName} = useClusterBaseInfo();
    const isMetaDatabasesAvailable = useDatabasesV2();
    const {data} = tenantApi.useGetTenantInfoQuery({
        database,
        clusterName,
        isMetaDatabasesAvailable,
    });
    return (
        <div data-qa={`cp-extension-${kind}`}>
            {data?.ControlPlane?.id}:{data?.ControlPlane?.name}
        </div>
    );
}

configureUIFactory({
    emMetaAvailable: true,
    hideNewFeaturesNotifications: {navigationV2: true},
    clusterOrDatabaseAccessError: {title: 'Request access to the database'},
    renderBackups: ({database}) => <ExternalExtension database={database} kind="backups" />,
    renderMonitoring: ({database}) => <ExternalExtension database={database} kind="monitoring" />,
    onEditDB: () => {
        throw new Error('Runtime edit callback must not be available without runtime');
    },
    onDeleteDB: () => {
        throw new Error('Runtime delete callback must not be available without runtime');
    },
});

const {store, history} = configureStore({environments: ['env-a', 'env-b']});

declare global {
    interface Window {
        controlPlaneTest: {
            navigate: (path: string) => void;
            isAuthenticated: () => boolean;
            whoamiStatus: (database: string) => string;
            /** Refetches tenant info the same way the overview polling does */
            refreshTenant: () => Promise<void>;
        };
    }
}

window.controlPlaneTest = {
    navigate: (path) => history.push(path),
    isAuthenticated: () => store.getState().authentication.isAuthenticated,
    whoamiStatus: (database) =>
        authenticationApi.endpoints.whoami.select({database})(store.getState()).status,
    refreshTenant: async () => {
        const search = new URLSearchParams(window.location.search);
        await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(
                {
                    database: search.get('database') || '',
                    clusterName: search.get('clusterName') || undefined,
                    isMetaDatabasesAvailable: true,
                },
                {forceRefetch: true, subscribe: false},
            ),
        );
    },
};

const root = document.getElementById('root');
if (!root) {
    throw new Error('Missing root');
}
ReactDOM.createRoot(root).render(<MultiClusterApp store={store} history={history} />);

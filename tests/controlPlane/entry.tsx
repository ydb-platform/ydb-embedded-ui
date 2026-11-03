import ReactDOM from 'react-dom/client';

import {Providers} from '../../src/containers/App/Providers';
import {useDatabaseAvailability} from '../../src/containers/Tenant/useDatabaseAvailability';
import {MultiClusterApp} from '../../src/lib';
import {configureStore} from '../../src/store';
import {authenticationApi} from '../../src/store/reducers/authentication/authentication';
import {useClusterBaseInfo} from '../../src/store/reducers/cluster/cluster';
import {tenantApi} from '../../src/store/reducers/tenant/tenant';
import {configureUIFactory} from '../../src/uiFactory/uiFactory';
import {useDatabasesV2} from '../../src/utils/hooks/useDatabasesV2';

import '../../src/styles/index.scss';

// Deliberately mirrors package consumers using data and the original query arguments.
function ExternalExtension({database, kind}: {database: string; kind: string}) {
    const {name: clusterName, monitoring} = useClusterBaseInfo();
    const isMetaDatabasesAvailable = useDatabasesV2();
    const {data} = tenantApi.useGetTenantInfoQuery({
        database,
        clusterName,
        isMetaDatabasesAvailable,
    });
    return (
        <div
            data-qa={`cp-extension-${kind}`}
            data-monitoring-cluster={
                typeof monitoring === 'object' ? monitoring.cluster_name : monitoring
            }
        >
            {data?.ControlPlane?.id}:{data?.ControlPlane?.name}
        </div>
    );
}

const noMeta = new URLSearchParams(window.location.search).has('noMeta');
configureUIFactory({
    emMetaAvailable: !noMeta,
    hideNewFeaturesNotifications: {navigationV2: true},
    renderBackups: ({database}) => <ExternalExtension database={database} kind="backups" />,
    renderMonitoring: ({database}) => <ExternalExtension database={database} kind="monitoring" />,
    onEditDB: () => {
        throw new Error('Runtime edit callback must not be available in degraded mode');
    },
    onDeleteDB: () => {
        throw new Error('Runtime delete callback must not be available in degraded mode');
    },
});
const {store, history} = configureStore({environments: ['env-a', 'env-b']});
declare global {
    interface Window {
        controlPlaneTest: {
            navigate: (path: string) => void;
            isAuthenticated: () => boolean;
            whoamiStatus: (database: string) => string;
            refresh: (queries: {tenant?: boolean; whoami?: boolean}) => Promise<void>;
        };
    }
}
window.controlPlaneTest = {
    navigate: (path) => history.push(path),
    isAuthenticated: () => store.getState().authentication.isAuthenticated,
    refresh: async (queries) => {
        const search = new URLSearchParams(window.location.search);
        const database = search.get('database') || '';
        const clusterName = search.get('clusterName') || undefined;
        if (queries.tenant) {
            await store.dispatch(
                tenantApi.endpoints.getTenantInfo.initiate(
                    {database, clusterName, isMetaDatabasesAvailable: true},
                    {forceRefetch: true, subscribe: false},
                ),
            );
        }
        if (queries.whoami) {
            await store.dispatch(
                authenticationApi.endpoints.whoami.initiate(
                    {database},
                    {forceRefetch: true, subscribe: false},
                ),
            );
        }
    },
    whoamiStatus: (database) =>
        authenticationApi.endpoints.whoami.select({database})(store.getState()).status,
};
if (noMeta) {
    delete window.api.meta;
}
const root = document.getElementById('root');
if (!root) {
    throw new Error('Missing root');
}
function SkippedAvailabilityProbe() {
    const {isLoading} = useDatabaseAvailability({skip: true});
    return <div data-qa="availability-loading">{isLoading ? 'loading' : 'idle'}</div>;
}

ReactDOM.createRoot(root).render(
    new URLSearchParams(window.location.search).has('skipAvailability') ? (
        <Providers store={store} history={history} appTitle="Availability probe">
            <SkippedAvailabilityProbe />
        </Providers>
    ) : (
        <MultiClusterApp store={store} history={history} />
    ),
);

import ReactDOM from 'react-dom/client';

import {SingleClusterApp} from '../../src/lib';
import {YdbEmbeddedAPI} from '../../src/services/api';
import {configureStore} from '../../src/store';
import {configureUIFactory} from '../../src/uiFactory/uiFactory';
import {configureZod} from '../../src/utils/zod/configureZod';

import '../../src/styles/index.scss';

declare global {
    interface Window {
        querySettingsEvents: {goal: string; params: Record<string, unknown>}[];
    }
}

window.querySettingsEvents = [];
Object.assign(window, {
    yaCounter1: {
        reachGoal: (goal: string, params: Record<string, unknown>) =>
            window.querySettingsEvents.push({goal, params}),
    },
});
configureZod();
configureUIFactory({
    hideNewFeaturesNotifications: {navigationV2: true},
    settingsBackend: {getEndpoint: () => window.location.origin, getUserId: () => 'test'},
    yaMetricaConfig: {
        yaMetricaMap: {test: 1},
        goals: {applyQuerySettings: 'applyQuerySettings'},
        getMetricaName: () => 'test',
    },
});
const api = new YdbEmbeddedAPI({
    webVersion: false,
    singleClusterMode: true,
    withCredentials: false,
    proxyMeta: false,
    useRelativePath: false,
    useMetaSettings: new URLSearchParams(window.location.search).has('remoteSettings'),
    csrfTokenGetter: undefined,
    defaults: undefined,
});
const {store, history} = configureStore({api, singleClusterMode: true});
const root = document.getElementById('root');
if (!root) {
    throw new Error('Missing test app root');
}
ReactDOM.createRoot(root).render(<SingleClusterApp store={store} history={history} />);

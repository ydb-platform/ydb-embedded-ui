import ReactDOM from 'react-dom/client';

import {MultiClusterApp, configureStore, configureUIFactory} from '../../src/lib';
import {configureZod} from '../../src/utils/zod/configureZod';

import '../../src/styles/index.scss';

configureZod();
configureUIFactory({
    emMetaAvailable: new URLSearchParams(window.location.search).get('emMetaAuth') !== '0',
    useMetaProxy: true,
    hideNewFeaturesNotifications: {navigationV2: true},
});
const {store, history} = configureStore({singleClusterMode: false});
const container = document.getElementById('root');
if (!container) {
    throw new Error('Missing test app root');
}
ReactDOM.createRoot(container).render(<MultiClusterApp store={store} history={history} />);

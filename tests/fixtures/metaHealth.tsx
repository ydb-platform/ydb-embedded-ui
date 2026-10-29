// The EM package consumer enables Meta databases through the public factory.
// Keep that configuration outside the ordinary standalone Viewer entry.
import ReactDOM from 'react-dom/client';

import {MultiClusterApp, configureStore, configureUIFactory} from '../../src/lib';

import '../../src/styles/index.scss';

configureUIFactory({emMetaAvailable: true, useMetaProxy: true});
const {store, history} = configureStore({singleClusterMode: false});
history.replace(`/cluster/databases${window.location.search}`);
const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element is missing');
}
ReactDOM.createRoot(container).render(<MultiClusterApp store={store} history={history} />);

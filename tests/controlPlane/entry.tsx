import {Link} from '@gravity-ui/uikit';
import ReactDOM from 'react-dom/client';

import {MultiClusterApp} from '../../src/lib';
import {configureStore} from '../../src/store';
import {configureUIFactory} from '../../src/uiFactory/uiFactory';

import '../../src/styles/index.scss';

configureUIFactory({
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

import ReactDOM from 'react-dom/client';

import {ErrorBoundary} from './lib';
import reportWebVitals from './reportWebVitals';
import {history, store} from './store/defaultStore';
import {configureUIFactory} from './uiFactory/uiFactory';

import './styles/index.scss';

const E2E_UI_OVERRIDES_ENABLED = process.env.REACT_APP_E2E_UI_OVERRIDES === 'true';

function applyE2EQueryEditorModeOverride() {
    if (!E2E_UI_OVERRIDES_ENABLED) {
        return;
    }

    const mode = window['e2eQueryEditorMode'];

    if (mode === 'single-tab') {
        configureUIFactory({enableMultiTabQueryEditor: false});
    } else if (mode === 'multi-tab') {
        configureUIFactory({enableMultiTabQueryEditor: true});
    }
}

async function render() {
    applyE2EQueryEditorModeOverride();

    let App;
    if (
        process.env.REACT_APP_META_BACKEND === undefined ||
        process.env.REACT_APP_META_BACKEND === 'undefined'
    ) {
        App = await import('./lib').then(({SingleClusterApp}) => SingleClusterApp);
    } else {
        App = await import('./lib').then(({MultiClusterApp}) => MultiClusterApp);
    }

    const container = document.getElementById('root');
    if (!container) {
        throw new Error("Can't find root element");
    }
    const root = ReactDOM.createRoot(container);
    root.render(
        <ErrorBoundary>
            <App store={store} history={history} />
        </ErrorBoundary>,
    );
}

render();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

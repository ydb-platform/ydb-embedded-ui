import ReactDOM from 'react-dom/client';

import {ErrorBoundary} from './lib';
import reportWebVitals from './reportWebVitals';
import {history, store} from './store/defaultStore';

import './styles/index.scss';

// test

async function render() {
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

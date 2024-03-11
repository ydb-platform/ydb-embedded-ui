import React from 'react';
import ReactDOM from 'react-dom';

import '@gravity-ui/uikit/styles/styles.scss';

import {ErrorBoundary} from './lib';
import {store, history} from './store/defaultStore';
import reportWebVitals from './reportWebVitals';

import './styles/themes.scss';
import './styles/constants.scss';
import './index.css';

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

    ReactDOM.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App store={store} history={history} />
            </ErrorBoundary>
        </React.StrictMode>,
        document.getElementById('root'),
    );
}

render();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom';

import '@gravity-ui/uikit/styles/styles.scss';

import {SingleClusterApp as App, ErrorBoundary, configureStore} from './lib';
import reportWebVitals from './reportWebVitals';

import './styles/themes.scss';
import './styles/constants.scss';
import './index.css';

const {store, history} = configureStore();

ReactDOM.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App store={store} history={history} />
        </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

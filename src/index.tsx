import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import '@gravity-ui/uikit/styles/styles.scss';

import App from './containers/App/App';
import configureStore from './store';
import reportWebVitals from './reportWebVitals';
import HistoryContext from './contexts/HistoryContext';

import './styles/themes.scss';
import './styles/constants.scss';
import './index.css';

const {store, history} = configureStore();
window.store = store;

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <HistoryContext.Provider value={history}>
                <App />
            </HistoryContext.Provider>
        </Provider>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

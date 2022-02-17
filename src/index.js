import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './containers/App/App';
import {Provider} from 'react-redux';
import configureStore from './store';
import reportWebVitals from './reportWebVitals';
import '@yandex-cloud/uikit/styles/styles.scss';
import HistoryContext from './contexts/HistoryContext';

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

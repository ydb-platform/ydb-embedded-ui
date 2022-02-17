import React from 'react';
import {createBrowserHistory} from 'history';

const HistoryContext = React.createContext(createBrowserHistory());
HistoryContext.displayName = 'HistoryContext';
export default HistoryContext;

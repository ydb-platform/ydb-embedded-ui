import * as monaco from 'monaco-editor';

import {LANGUAGE_YQL_ID} from './constants';
import {conf, getLanguage} from './yql';

export function registerYqlLanguage() {
    monaco.languages.register({id: LANGUAGE_YQL_ID});
    monaco.languages.setMonarchTokensProvider(LANGUAGE_YQL_ID, getLanguage());
    monaco.languages.setLanguageConfiguration(LANGUAGE_YQL_ID, conf);
}

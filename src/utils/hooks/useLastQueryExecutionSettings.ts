import type {QuerySettings} from '../../types/store/query';
import {LAST_QUERY_EXECUTION_SETTINGS_KEY} from '../constants';

import {useSetting} from './useSetting';

export const useLastQueryExecutionSettings = () => {
    const [lastStorageSettings, setLastSettings] = useSetting<QuerySettings | undefined>(
        LAST_QUERY_EXECUTION_SETTINGS_KEY,
    );

    const lastSettings: QuerySettings | undefined = lastStorageSettings
        ? {
              transactionMode: lastStorageSettings.transactionMode,
              queryMode: lastStorageSettings.queryMode,
              statisticsMode: lastStorageSettings.statisticsMode,
              tracingLevel: lastStorageSettings.tracingLevel,
              limitRows: lastStorageSettings.limitRows,
              timeout: lastStorageSettings.timeout,
          }
        : undefined;

    return [lastSettings, setLastSettings] as const;
};

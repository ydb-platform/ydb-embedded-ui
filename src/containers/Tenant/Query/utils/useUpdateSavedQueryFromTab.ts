import React from 'react';

import type {QueryTabState} from '../../../../store/reducers/query/types';
import createToast from '../../../../utils/createToast';
import i18n from '../i18n';

import {useSavedQueries} from './useSavedQueries';

export function useUpdateSavedQueryFromTab() {
    const {updateSavedQuery} = useSavedQueries();

    return React.useCallback(
        (tab: QueryTabState, nextName: string, queryBody: string) => {
            if (!tab.savedQueryName) {
                return false;
            }

            const result = updateSavedQuery(tab.savedQueryName, nextName, queryBody, tab.id);
            if (result === 'updated') {
                return true;
            }

            const isDuplicate = result === 'duplicate';
            createToast({
                name: isDuplicate ? 'saved-query-name-exists' : 'saved-query-not-found',
                title: '',
                content: i18n(
                    isDuplicate ? 'alert_saved-query-name-exists' : 'alert_saved-query-not-found',
                ),
                theme: 'danger',
            });
            return false;
        },
        [updateSavedQuery],
    );
}

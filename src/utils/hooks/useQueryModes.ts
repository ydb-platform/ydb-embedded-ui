import type {QueryMode} from '../../types/store/query';
import {ENABLE_ADDITIONAL_QUERY_MODES, QUERY_INITIAL_MODE_KEY} from '../constants';
import {QUERY_MODES_TITLES, isNewQueryMode} from '../query';
import createToast from '../createToast';
import {useSetting} from './useSetting';
import i18n from './i18n';

export type SetQueryModeIfAvailable = (
    value: QueryMode,
    errorMessage?: string | undefined,
) => boolean;

export const useQueryModes = (): [QueryMode, SetQueryModeIfAvailable] => {
    const [queryMode, setQueryMode] = useSetting<QueryMode>(QUERY_INITIAL_MODE_KEY);
    const [enableAdditionalQueryModes] = useSetting<boolean>(ENABLE_ADDITIONAL_QUERY_MODES);

    const setQueryModeIfAvailable: SetQueryModeIfAvailable = (value, errorMessage) => {
        if (isNewQueryMode(value) && !enableAdditionalQueryModes) {
            createToast({
                name: 'QueryModeCannotBeSet',
                title:
                    errorMessage ??
                    i18n('useQueryModes.queryModeCannotBeSet', {mode: QUERY_MODES_TITLES[value]}),
                type: 'error',
            });

            return false;
        } else {
            setQueryMode(value);

            return true;
        }
    };

    return [queryMode, setQueryModeIfAvailable];
};

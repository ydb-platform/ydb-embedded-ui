import React from 'react';

import {StringParam, useQueryParam} from 'use-query-params';

import {useMetaEnvironmentsAvailable} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useSetting} from '../../utils/hooks';

export function useDatabasesPageEnvironment(environments?: string[]) {
    const [envParamFromQuery, setEnvParamToQuery] = useQueryParam('env', StringParam);

    const [savedEnvironment, saveEnvironment] = useSetting<string | undefined>(
        SETTING_KEYS.DATABASES_PAGE_ENVIRONMENT,
    );

    const metaEnvironmentsAvailable = useMetaEnvironmentsAvailable();

    const databasesPageEnvironment = React.useMemo<string | undefined>(() => {
        if (!metaEnvironmentsAvailable) {
            return undefined;
        }
        if (!environments) {
            return savedEnvironment;
        }

        const pageEnvironment = envParamFromQuery ?? savedEnvironment;

        if (pageEnvironment && environments?.includes(pageEnvironment)) {
            return pageEnvironment;
        }
        const factoryDefault = uiFactory.databasesEnvironmentsConfig?.defaultEnvironment;
        if (factoryDefault && environments?.includes(factoryDefault)) {
            return factoryDefault;
        }
        return environments?.[0];
    }, [metaEnvironmentsAvailable, envParamFromQuery, savedEnvironment, environments]);

    const handleEnvironmentChange = React.useCallback(
        (value: string) => {
            setEnvParamToQuery(value, 'replaceIn');
            saveEnvironment(value);
        },
        [setEnvParamToQuery, saveEnvironment],
    );

    return {
        databasesPageEnvironment,
        envParamFromQuery,
        handleEnvironmentChange,
    };
}

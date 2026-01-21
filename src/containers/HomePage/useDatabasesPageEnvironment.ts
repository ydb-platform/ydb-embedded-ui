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
        if (!metaEnvironmentsAvailable || !environments) {
            return undefined;
        }

        // Do not use environment with external domain
        // if it comes from query or settings
        if (isSameDomainValidEnv(envParamFromQuery, environments)) {
            return envParamFromQuery;
        }
        if (isSameDomainValidEnv(savedEnvironment, environments)) {
            return savedEnvironment;
        }

        const factoryDefault = uiFactory.databasesEnvironmentsConfig?.getDefaultEnvironment?.();
        if (isSameDomainValidEnv(factoryDefault, environments)) {
            return factoryDefault;
        }

        // Return first env that does not have specified external domain
        return environments.find((env) => !getEnvDomain(env));
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

function isSameDomainValidEnv(
    env: string | null | undefined,
    environments: string[],
): env is string {
    return Boolean(env && environments.includes(env) && !getEnvDomain(env));
}
function getEnvDomain(env: string) {
    return uiFactory.databasesEnvironmentsConfig?.getEnvironmentDomain?.(env);
}

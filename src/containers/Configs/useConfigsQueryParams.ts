import React from 'react';

import {StringParam, createEnumParam, useQueryParams, withDefault} from 'use-query-params';

import {
    useBaseConfigAvailable,
    useFeatureFlagsAvailable,
} from '../../store/reducers/capabilities/hooks';

import type {ConfigType} from './types';
import {ConfigTypes} from './types';

const configTypesArray: ConfigType[] = [
    ConfigTypes.current,
    ConfigTypes.startup,
    ConfigTypes.features,
];

export const ConfigTypeValueEnum = createEnumParam(configTypesArray);
export const ConfigTypeValueParam = withDefault<ConfigType | undefined | null, 'current'>(
    ConfigTypeValueEnum,
    'current',
);

export function useConfigQueryParams() {
    const isFeaturesAvailable = useFeatureFlagsAvailable();
    const isConfigsAvailable = useBaseConfigAvailable();
    const [{configType, search}, setQueryParams] = useQueryParams({
        configType: ConfigTypeValueParam,
        search: StringParam,
    });
    const handleConfigTypeChange = React.useCallback(
        (value?: ConfigType) => {
            setQueryParams({configType: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleSearchChange = React.useCallback(
        (value?: string) => {
            setQueryParams({search: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    React.useEffect(() => {
        if (!isConfigsAvailable && !isFeaturesAvailable) {
            handleConfigTypeChange(undefined);
        } else if (!isFeaturesAvailable && configType === ConfigTypes.features) {
            handleConfigTypeChange(ConfigTypes.current);
        } else {
            handleConfigTypeChange(ConfigTypes.features);
        }
    }, [isFeaturesAvailable, isConfigsAvailable]);

    return {
        configType,
        handleConfigTypeChange,
        search,
        handleSearchChange,
    };
}

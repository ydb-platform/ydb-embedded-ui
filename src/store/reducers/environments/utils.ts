import type {MetaEnvironmentsResponse} from '../../../types/api/environments';
import {uiFactory} from '../../../uiFactory/uiFactory';

export function prepareEnvironments(environmentsResponse: MetaEnvironmentsResponse) {
    const determinedEnvironments = uiFactory.databasesEnvironmentsConfig?.getEnvironments?.();

    if (determinedEnvironments?.length) {
        return determinedEnvironments;
    }

    const rawEnvironments = environmentsResponse?.environments.map((env) => env.name) ?? [];
    const supportedEnvironments = uiFactory.databasesEnvironmentsConfig?.getSupportedEnvironments();

    if (!supportedEnvironments?.length) {
        return [];
    }

    // Return only environments that are in supported environments list
    return supportedEnvironments.filter((envName) => rawEnvironments.includes(envName));
}

import type {QuerySettings} from '../../../../types/store/query';
import {RESOURCE_POOL_NO_OVERRIDE_VALUE, getEffectiveQueryTimeout} from '../../../../utils/query';

const settingKeys = [
    'queryMode',
    'transactionMode',
    'statisticsMode',
    'tracingLevel',
    'timeout',
    'limitRows',
    'outputChunkMaxSize',
    'pragmas',
    'resourcePool',
] as const;

export function getQuerySettingsMetricaParams(
    initial: QuerySettings,
    draft: QuerySettings,
    streamingEnabled: boolean,
) {
    const applied = {...draft, timeout: getEffectiveQueryTimeout(draft, streamingEnabled)};
    const changed = settingKeys.filter((key) => initial[key] !== applied[key]);
    if (!changed.length) {
        return undefined;
    }

    // Prefix text and user-defined pool names must not be sent to analytics.
    return {
        ...Object.fromEntries(changed.map((key) => [`${key}Changed`, true])),
        queryMode: applied.queryMode,
        transactionMode: applied.transactionMode,
        statisticsMode: applied.statisticsMode,
        tracingLevel: applied.tracingLevel,
        timeoutEnabled: applied.timeout !== null,
        timeoutSeconds: applied.timeout ?? null,
        limitRows: applied.limitRows ?? null,
        outputChunkMaxSize: applied.outputChunkMaxSize ?? null,
        queryPrefixPresent: Boolean(applied.pragmas.trim()),
        resourcePoolOverride: Boolean(
            applied.resourcePool && applied.resourcePool !== RESOURCE_POOL_NO_OVERRIDE_VALUE,
        ),
    };
}

import {DEFAULT_QUERY_SETTINGS} from '../../../../../utils/query';
import {getQuerySettingsMetricaParams} from '../getQuerySettingsMetricaParams';

test('does not record an unchanged draft', () => {
    expect(
        getQuerySettingsMetricaParams(DEFAULT_QUERY_SETTINGS, {...DEFAULT_QUERY_SETTINGS}),
    ).toBeUndefined();
});

test('records clearing optional values without exposing prefix or pool names', () => {
    const initial = {...DEFAULT_QUERY_SETTINGS, outputChunkMaxSize: 1234, limitRows: 20};
    const applied = {
        ...initial,
        outputChunkMaxSize: undefined,
        limitRows: undefined,
        pragmas: 'private SQL',
        resourcePool: 'private-pool',
    };
    const params = getQuerySettingsMetricaParams(initial, applied);
    expect(params).toEqual({
        outputChunkMaxSizeChanged: true,
        limitRowsChanged: true,
        pragmasChanged: true,
        resourcePoolChanged: true,
        queryMode: initial.queryMode,
        transactionMode: initial.transactionMode,
        statisticsMode: initial.statisticsMode,
        tracingLevel: initial.tracingLevel,
        timeoutEnabled: false,
        timeoutSeconds: null,
        outputChunkMaxSize: null,
        limitRows: null,
        queryPrefixPresent: true,
        resourcePoolOverride: true,
    });
});

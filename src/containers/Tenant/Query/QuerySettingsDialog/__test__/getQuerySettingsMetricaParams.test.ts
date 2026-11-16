import {DEFAULT_QUERY_SETTINGS, querySettingsRestoreSchema} from '../../../../../utils/query';
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
    expect(params).toEqual(
        expect.objectContaining({
            outputChunkMaxSizeChanged: true,
            limitRowsChanged: true,
            outputChunkMaxSize: null,
            limitRows: null,
            pragmasChanged: true,
            resourcePoolChanged: true,
            queryPrefixPresent: true,
            resourcePoolOverride: true,
        }),
    );
    expect(JSON.stringify(params)).not.toContain('private');
});

test('uses Full for missing or invalid stored statistics, preserving explicit choices', () => {
    expect(querySettingsRestoreSchema.parse(undefined).statisticsMode).toBe('full');
    expect(
        querySettingsRestoreSchema.parse({...DEFAULT_QUERY_SETTINGS, statisticsMode: 'invalid'})
            .statisticsMode,
    ).toBe('full');
    for (const statisticsMode of ['none', 'basic', 'full', 'profile']) {
        expect(
            querySettingsRestoreSchema.parse({...DEFAULT_QUERY_SETTINGS, statisticsMode})
                .statisticsMode,
        ).toBe(statisticsMode);
    }
});

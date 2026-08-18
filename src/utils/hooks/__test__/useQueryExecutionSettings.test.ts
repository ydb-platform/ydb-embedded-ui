import {renderHook} from '@testing-library/react';

import {useSnapshotReadWriteAvailable} from '../../../store/reducers/capabilities/hooks';
import type {QuerySettings} from '../../../types/store/query';
import {
    DEFAULT_QUERY_SETTINGS,
    QUERY_MODES,
    RESOURCE_POOL_NO_OVERRIDE_VALUE,
    STATISTICS_MODES,
    TRACING_LEVELS,
    TRANSACTION_MODES,
} from '../../query';
import {useQueryExecutionSettings} from '../useQueryExecutionSettings';
import * as useSettingModule from '../useSetting';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useTracingLevelOptionAvailable: jest.fn(() => true),
    useSnapshotReadWriteAvailable: jest.fn(() => true),
}));

const mockUseSnapshotReadWriteAvailable = jest.mocked(useSnapshotReadWriteAvailable);

jest.mock('../useQueryStreamingSetting', () => ({
    useQueryStreamingSetting: jest.fn(() => [false]),
}));

jest.mock('../useSetting');

function createSettings(overrides: Partial<QuerySettings> = {}): QuerySettings {
    return {
        queryMode: QUERY_MODES.query,
        timeout: 60000,
        limitRows: 1000,
        statisticsMode: STATISTICS_MODES.none,
        transactionMode: TRANSACTION_MODES.serializable,
        tracingLevel: TRACING_LEVELS.off,
        pragmas: 'PRAGMA OrderedColumns;',
        resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
        ...overrides,
    };
}

describe('useQueryExecutionSettings', () => {
    let mockSetSettings: jest.Mock;
    let mockUseSetting: jest.SpyInstance;

    beforeEach(() => {
        mockSetSettings = jest.fn();
        mockUseSetting = jest.spyOn(useSettingModule, 'useSetting');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('falls back from snapshot read-write when the capability is unavailable', () => {
        mockUseSnapshotReadWriteAvailable.mockReturnValue(false);
        const storageSettings = createSettings({
            transactionMode: TRANSACTION_MODES.snapshotrw,
        });
        mockUseSetting.mockReturnValue([storageSettings, mockSetSettings]);

        const {result} = renderHook(() => useQueryExecutionSettings());

        expect(result.current[0].transactionMode).toBe(DEFAULT_QUERY_SETTINGS.transactionMode);
    });

    test('keeps snapshot read-write when the capability is available', () => {
        mockUseSnapshotReadWriteAvailable.mockReturnValue(true);
        const storageSettings = createSettings({
            transactionMode: TRANSACTION_MODES.snapshotrw,
        });
        mockUseSetting.mockReturnValue([storageSettings, mockSetSettings]);

        const {result} = renderHook(() => useQueryExecutionSettings());

        expect(result.current[0].transactionMode).toBe(TRANSACTION_MODES.snapshotrw);
    });
});

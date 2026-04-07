import React from 'react';

import {renderHook} from '@testing-library/react';

import {useSnapshotReadWriteAvailable} from '../../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
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

// Mock dependencies
jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useTracingLevelOptionAvailable: jest.fn(() => true),
    useSnapshotReadWriteAvailable: jest.fn(() => true),
}));

const mockUseSnapshotReadWriteAvailable = jest.mocked(useSnapshotReadWriteAvailable);

jest.mock('../useQueryStreamingSetting', () => ({
    useQueryStreamingSetting: jest.fn(() => [false]),
}));

jest.mock('../useSetting');

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

    describe('setQueryExecutionSettings with useShowPlanToSvg enabled', () => {
        it('should save statisticsMode from input settings, not from storage', () => {
            // Mock storage settings with 'basic' mode
            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.scan,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.basic,
                transactionMode: TRANSACTION_MODES.serializable,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            // Mock useShowPlanToSvg as true
            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [true];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [, setQueryExecutionSettings] = result.current;

            // User wants to save 'profile' mode (which is SVG-compatible)
            const newSettings = {
                ...storageSettings,
                statisticsMode: STATISTICS_MODES.profile,
            };

            React.act(() => {
                setQueryExecutionSettings(newSettings);
            });

            // Should save 'profile' from input, not 'basic' from storage
            expect(mockSetSettings).toHaveBeenCalledWith({
                ...newSettings,
                statisticsMode: STATISTICS_MODES.profile,
            });
        });

        it('should convert non-SVG statisticsMode to full when useShowPlanToSvg is true', () => {
            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.scan,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.none,
                transactionMode: TRANSACTION_MODES.serializable,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [true];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [, setQueryExecutionSettings] = result.current;

            // User wants to save 'basic' mode (not SVG-compatible)
            const newSettings = {
                ...storageSettings,
                statisticsMode: STATISTICS_MODES.basic,
            };

            React.act(() => {
                setQueryExecutionSettings(newSettings);
            });

            // Should convert 'basic' to 'full' because SVG is enabled
            expect(mockSetSettings).toHaveBeenCalledWith({
                ...newSettings,
                statisticsMode: STATISTICS_MODES.full,
            });
        });

        it('should keep SVG-compatible modes (full, profile) when useShowPlanToSvg is true', () => {
            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.scan,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.none,
                transactionMode: TRANSACTION_MODES.serializable,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [true];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [, setQueryExecutionSettings] = result.current;

            // Test with 'full' mode
            React.act(() => {
                setQueryExecutionSettings({
                    ...storageSettings,
                    statisticsMode: STATISTICS_MODES.full,
                });
            });

            expect(mockSetSettings).toHaveBeenCalledWith({
                ...storageSettings,
                statisticsMode: STATISTICS_MODES.full,
            });

            // Test with 'profile' mode
            React.act(() => {
                setQueryExecutionSettings({
                    ...storageSettings,
                    statisticsMode: STATISTICS_MODES.profile,
                });
            });

            expect(mockSetSettings).toHaveBeenCalledWith({
                ...storageSettings,
                statisticsMode: STATISTICS_MODES.profile,
            });
        });
    });

    describe('setQueryExecutionSettings with useShowPlanToSvg disabled', () => {
        it('should save statisticsMode as-is when useShowPlanToSvg is false', () => {
            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.scan,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.full,
                transactionMode: TRANSACTION_MODES.serializable,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [false];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [, setQueryExecutionSettings] = result.current;

            // User wants to save 'basic' mode
            const newSettings = {
                ...storageSettings,
                statisticsMode: STATISTICS_MODES.basic,
            };

            React.act(() => {
                setQueryExecutionSettings(newSettings);
            });

            // Should save 'basic' as-is without conversion
            expect(mockSetSettings).toHaveBeenCalledWith({
                ...newSettings,
                statisticsMode: STATISTICS_MODES.basic,
            });
        });

        it('should allow saving any statisticsMode when useShowPlanToSvg is false', () => {
            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.scan,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.full,
                transactionMode: TRANSACTION_MODES.serializable,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [false];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [, setQueryExecutionSettings] = result.current;

            // Test all statistics modes
            const modes = [
                STATISTICS_MODES.none,
                STATISTICS_MODES.basic,
                STATISTICS_MODES.full,
                STATISTICS_MODES.profile,
            ];

            modes.forEach((mode) => {
                React.act(() => {
                    setQueryExecutionSettings({
                        ...storageSettings,
                        statisticsMode: mode,
                    });
                });

                expect(mockSetSettings).toHaveBeenCalledWith({
                    ...storageSettings,
                    statisticsMode: mode,
                });
            });
        });
    });

    describe('callback stability', () => {
        it('should not recreate setQueryExecutionSettings when storage settings change', () => {
            const initialSettings: QuerySettings = {
                queryMode: QUERY_MODES.scan,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.none,
                transactionMode: TRANSACTION_MODES.serializable,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [initialSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [true];
                }
                return [undefined];
            });

            const {result, rerender} = renderHook(() => useQueryExecutionSettings());
            const [, firstCallback] = result.current;

            // Change storage settings
            const updatedSettings = {
                ...initialSettings,
                statisticsMode: STATISTICS_MODES.full,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [updatedSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [true];
                }
                return [undefined];
            });

            rerender();
            const [, secondCallback] = result.current;

            // Callback should be the same reference (stable)
            expect(firstCallback).toBe(secondCallback);
        });
    });

    describe('snapshot read-write capability fallback', () => {
        it('should reset transactionMode to implicit when snapshotrw capability is unavailable', () => {
            mockUseSnapshotReadWriteAvailable.mockReturnValue(false);

            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.query,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.none,
                transactionMode: TRANSACTION_MODES.snapshotrw,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [false];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [settings] = result.current;

            expect(settings.transactionMode).toBe(DEFAULT_QUERY_SETTINGS.transactionMode);
        });

        it('should keep snapshotrw transactionMode when capability is available', () => {
            mockUseSnapshotReadWriteAvailable.mockReturnValue(true);

            const storageSettings: QuerySettings = {
                queryMode: QUERY_MODES.query,
                timeout: 60000,
                limitRows: 1000,
                statisticsMode: STATISTICS_MODES.none,
                transactionMode: TRANSACTION_MODES.snapshotrw,
                tracingLevel: TRACING_LEVELS.off,
                pragmas: 'PRAGMA OrderedColumns;',
                resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
            };

            mockUseSetting.mockImplementation((key: string) => {
                if (key === SETTING_KEYS.QUERY_EXECUTION_SETTINGS) {
                    return [storageSettings, mockSetSettings];
                }
                if (key === SETTING_KEYS.USE_SHOW_PLAN_SVG) {
                    return [false];
                }
                return [undefined];
            });

            const {result} = renderHook(() => useQueryExecutionSettings());
            const [settings] = result.current;

            expect(settings.transactionMode).toBe(TRANSACTION_MODES.snapshotrw);
        });
    });
});

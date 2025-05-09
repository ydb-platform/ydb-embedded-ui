import {TPDiskState} from '../../../types/api/pdisk';
import {calculatePDiskSeverity} from '../calculatePDiskSeverity';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../constants';

describe('PDisk state', () => {
    test('Should determine severity based on State if space severity is OK', () => {
        const normalDiskSeverity = calculatePDiskSeverity({State: TPDiskState.Normal});
        const erroredDiskSeverity = calculatePDiskSeverity({State: TPDiskState.ChunkQuotaError});

        expect(normalDiskSeverity).not.toEqual(erroredDiskSeverity);
    });

    test('Should determine severity based on space utilization if state severity is OK', () => {
        const severity1 = calculatePDiskSeverity({State: TPDiskState.Normal, AllocatedPercent: 0});
        const severity2 = calculatePDiskSeverity({State: TPDiskState.Normal, AllocatedPercent: 86});
        const severity3 = calculatePDiskSeverity({State: TPDiskState.Normal, AllocatedPercent: 96});

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow);
        expect(severity3).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
    });

    test('Should determine severity based on max severity of state and space utilization ', () => {
        const severity1 = calculatePDiskSeverity({
            State: TPDiskState.ChunkQuotaError,
            AllocatedPercent: 0,
        });
        const severity2 = calculatePDiskSeverity({State: TPDiskState.Normal, AllocatedPercent: 96});

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
    });

    test('Should display as unavailabe when no State is provided', () => {
        const severity1 = calculatePDiskSeverity({});
        const severity2 = calculatePDiskSeverity({State: TPDiskState.ChunkQuotaError});

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity2).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
    });

    test('Should display as unavailabe when no State is provided event if space severity is not OK', () => {
        const severity1 = calculatePDiskSeverity({AllocatedPercent: 86});
        const severity2 = calculatePDiskSeverity({AllocatedPercent: 96});

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
    });
});

import {EFlag} from '../../../types/api/enums';
import {EVDiskState} from '../../../types/api/vdisk';
import {calculateVDiskSeverity} from '../calculateVDiskSeverity';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../constants';

describe('VDisk state', () => {
    test('Should determine severity based on the highest value among VDiskState, DiskSpace and FrontQueues', () => {
        const severity1 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            DiskSpace: EFlag.Yellow, // severity 3, yellow
            FrontQueues: EFlag.Green, // severity 1, green
        });
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.PDiskError, // severity 5, red
            DiskSpace: EFlag.Yellow, // severity 3, yellow
            FrontQueues: EFlag.Green, // severity 1, green
        });
        const severity3 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            DiskSpace: EFlag.Yellow, // severity 3, yellow
            FrontQueues: EFlag.Orange, // severity 4, orange
        });

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
        expect(severity3).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Orange);
    });

    test('Should not pick the highest severity based on FrontQueues value', () => {
        const severity1 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            DiskSpace: EFlag.Green, // severity 1, green
            FrontQueues: EFlag.Red, // severity 5, red
        });
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            DiskSpace: EFlag.Red, // severity 5, red
            FrontQueues: EFlag.Red, // severity 5, red
        });

        expect(severity1).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
    });

    // prettier-ignore
    test('Should display as unavailable when no VDiskState is provided', () => {
        const severity1 = calculateVDiskSeverity({});
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK
        });
        const severity3 = calculateVDiskSeverity({
                                        DiskSpace: EFlag.Green
        });
        const severity4 = calculateVDiskSeverity({
                                                                FrontQueues: EFlag.Green
        });
        const severity5 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, DiskSpace: EFlag.Green
        });
        const severity6 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK,                         FrontQueues: EFlag.Green
        });
        const severity7 = calculateVDiskSeverity({
                                        DiskSpace: EFlag.Green, FrontQueues: EFlag.Green
        });
        const severity8 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, DiskSpace: EFlag.Green, FrontQueues: EFlag.Green
        });

        // unavailable disks display with the grey color
        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity2).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity3).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity4).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity5).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity6).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity7).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
        expect(severity8).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
    });

    test('Should display as unavailable when no VDiskState is provided even if DiskSpace or FrontQueues flags are not green', () => {
        const severity1 = calculateVDiskSeverity({
            DiskSpace: EFlag.Red,
            FrontQueues: EFlag.Yellow,
        });

        // unavailable disks display with the grey color
        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey);
    });

    test('Should display replicating VDisks in OK state with a distinct color', () => {
        const severity1 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            Replicated: false,
        });
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            Replicated: true,
        });

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
        expect(severity2).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
    });

    test('Should not display VDisk as replicating if Replicated is undefined', () => {
        const severity = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            Replicated: undefined,
        });

        expect(severity).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
    });

    test('Should not display VDisk as replicating if DiskSpace or FrontQueues are blue', () => {
        const severity1 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK,
            FrontQueues: EFlag.Blue,
        });
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK,
            DiskSpace: EFlag.Blue,
        });

        expect(severity1).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
        expect(severity2).not.toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
    });

    test('Should display replicating VDisks in a not-OK state with a regular color', () => {
        const severity1 = calculateVDiskSeverity({
            VDiskState: EVDiskState.Initial, // severity 3, yellow
            Replicated: false,
        });
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.PDiskError, // severity 5, red
            Replicated: false,
        });

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
    });

    test('Should always display donor VDisks with a regular color', () => {
        const severity1 = calculateVDiskSeverity({
            VDiskState: EVDiskState.OK, // severity 1, green
            Replicated: false, // donors are always in the not replicated state since they are leftovers
            DonorMode: true,
        });
        const severity2 = calculateVDiskSeverity({
            VDiskState: EVDiskState.Initial, // severity 3, yellow
            Replicated: false,
            DonorMode: true,
        });
        const severity3 = calculateVDiskSeverity({
            VDiskState: EVDiskState.PDiskError, // severity 5, red
            Replicated: false,
            DonorMode: true,
        });

        expect(severity1).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
        expect(severity2).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow);
        expect(severity3).toEqual(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red);
    });
});

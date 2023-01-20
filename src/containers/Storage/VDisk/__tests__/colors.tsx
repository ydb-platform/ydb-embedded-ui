import {renderWithStore} from '../../../../utils/tests/providers';

import {EVDiskState} from '../../../../types/api/vdisk';
import {EFlag} from '../../../../types/api/enums';

import {VDisk} from '../VDisk';

describe('VDisk state', () => {
    it('Should determine severity based on the highest value among VDiskState, DiskSpace and FrontQueues', () => {
        const {getAllByRole} = renderWithStore(
            <>
                <VDisk
                    data={{
                        VDiskId: {Domain: 1},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        DiskSpace: EFlag.Yellow, // severity 3, yellow
                        FrontQueues: EFlag.Green, // severity 1, green
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 2},
                        VDiskState: EVDiskState.PDiskError, // severity 5, red
                        DiskSpace: EFlag.Yellow, // severity 3, yellow
                        FrontQueues: EFlag.Green, // severity 1, green
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 3},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        DiskSpace: EFlag.Yellow, // severity 3, yellow
                        FrontQueues: EFlag.Orange, // severity 4, orange
                    }}
                />
            </>,
        );

        const [disk1, disk2, disk3] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_yellow\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
        expect(disk3.className).toMatch(/_orange\b/i);
    });

    it('Should not pick the highest severity based on FrontQueues value', () => {
        const {getAllByRole} = renderWithStore(
            <>
                <VDisk
                    data={{
                        VDiskId: {Domain: 1},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        DiskSpace: EFlag.Green, // severity 1, green
                        FrontQueues: EFlag.Red, // severity 5, red
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 2},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        DiskSpace: EFlag.Red, // severity 5, red
                        FrontQueues: EFlag.Red, // severity 5, red
                    }}
                />
            </>,
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).not.toMatch(/_red\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
    });

    // prettier-ignore
    it('Should display as unavailable when no VDiskState is provided', () => {
        const {getAllByRole} = renderWithStore(
            <>
                <VDisk data={{VDiskId: {Domain: 1}}} />
                <VDisk data={{VDiskId: {Domain: 2}, VDiskState: EVDiskState.OK}} />
                <VDisk data={{VDiskId: {Domain: 3},                             DiskSpace: EFlag.Green}} />
                <VDisk data={{VDiskId: {Domain: 4},                                                     FrontQueues: EFlag.Green}} />
                <VDisk data={{VDiskId: {Domain: 5}, VDiskState: EVDiskState.OK, DiskSpace: EFlag.Green}} />
                <VDisk data={{VDiskId: {Domain: 6}, VDiskState: EVDiskState.OK,                         FrontQueues: EFlag.Green}} />
                <VDisk data={{VDiskId: {Domain: 7},                             DiskSpace: EFlag.Green, FrontQueues: EFlag.Green}} />
                <VDisk data={{VDiskId: {Domain: 8}, VDiskState: EVDiskState.OK, DiskSpace: EFlag.Green, FrontQueues: EFlag.Green}} />
            </>
        );

        const [disk1, disk2, disk3, disk4, disk5, disk6, disk7, disk8] =
            getAllByRole('meter');

        // unavailable disks display with the grey color
        expect(disk1.className).toMatch(/_grey\b/i);
        expect(disk2.className).not.toMatch(/_grey\b/i);
        expect(disk3.className).toMatch(/_grey\b/i);
        expect(disk4.className).toMatch(/_grey\b/i);
        expect(disk5.className).not.toMatch(/_grey\b/i);
        expect(disk6.className).not.toMatch(/_grey\b/i);
        expect(disk7.className).toMatch(/_grey\b/i);
        expect(disk8.className).not.toMatch(/_grey\b/i);
    });

    it('Should display as unavailable when no VDiskState is provided even if DiskSpace or FrontQueues flags are not green', () => {
        const {getByRole} = renderWithStore(
            <VDisk
                data={{
                    VDiskId: {Domain: 1},
                    DiskSpace: EFlag.Red,
                    FrontQueues: EFlag.Yellow,
                }}
            />,
        );

        const disk = getByRole('meter');

        // unavailable disks display with the grey color
        expect(disk.className).toMatch(/_grey\b/i);
    });

    it('Should display replicating VDisks in OK state with a distinct color', () => {
        const {getAllByRole} = renderWithStore(
            <>
                <VDisk
                    data={{
                        VDiskId: {Domain: 1},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        Replicated: false,
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 2},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        Replicated: true,
                    }}
                />
            </>,
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_blue\b/i);
        expect(disk2.className).not.toMatch(/_blue\b/i);
    });

    it('Should display replicating VDisks in a not-OK state with a regular color', () => {
        const {getAllByRole} = renderWithStore(
            <>
                <VDisk
                    data={{
                        VDiskId: {Domain: 1},
                        VDiskState: EVDiskState.Initial, // severity 3, yellow
                        Replicated: false,
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 2},
                        VDiskState: EVDiskState.PDiskError, // severity 5, red
                        Replicated: false,
                    }}
                />
            </>,
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_yellow\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
    });

    it('Should always display donor VDisks with a regular color', () => {
        const {getAllByRole} = renderWithStore(
            <>
                <VDisk
                    data={{
                        VDiskId: {Domain: 1},
                        VDiskState: EVDiskState.OK, // severity 1, green
                        Replicated: false, // donors are always in the not replicated state since they are leftovers
                        DonorMode: true,
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 2},
                        VDiskState: EVDiskState.Initial, // severity 3, yellow
                        Replicated: false,
                        DonorMode: true,
                    }}
                />
                <VDisk
                    data={{
                        VDiskId: {Domain: 3},
                        VDiskState: EVDiskState.PDiskError, // severity 5, red
                        Replicated: false,
                        DonorMode: true,
                    }}
                />
            </>,
        );

        const [disk1, disk2, disk3] = getAllByRole('meter');

        expect(disk1.className).not.toMatch(/_blue\b/i);
        expect(disk1.className).toMatch(/_green\b/i);
        expect(disk2.className).toMatch(/_yellow\b/i);
        expect(disk3.className).toMatch(/_red\b/i);
    });
});

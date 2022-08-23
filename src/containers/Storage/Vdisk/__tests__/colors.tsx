import {render} from '@testing-library/react'

import VDisk from '../Vdisk'

describe('VDisk state', () => {
    it('Should determine severity based on the highest value among VDiskState, DiskSpace and FrontQueues', () => {
        const {getAllByRole} = render(
            <>
                <VDisk
                    VDiskId={{Domain: 1}}
                    VDiskState="OK" // severity 1, green
                    DiskSpace="Yellow" // severity 3, yellow
                    FrontQueues="Green" // severity 1, green
                />
                <VDisk
                    VDiskId={{Domain: 2}}
                    VDiskState="PDiskError" // severity 5, red
                    DiskSpace="Yellow" // severity 3, yellow
                    FrontQueues="Green" // severity 1, green
                />
                <VDisk
                    VDiskId={{Domain: 3}}
                    VDiskState="OK" // severity 1, green
                    DiskSpace="Yellow" // severity 3, yellow
                    FrontQueues="Orange" // severity 4, orange
                />
            </>
        );

        const [disk1, disk2, disk3] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_yellow\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
        expect(disk3.className).toMatch(/_orange\b/i);
    });

    it('Should not pick the highest severity based on FrontQueues value', () => {
        const {getAllByRole} = render(
            <>
                <VDisk
                    VDiskId={{Domain: 1}}
                    VDiskState="OK" // severity 1, green
                    DiskSpace="Green" // severity 1, green
                    FrontQueues="Red" // severity 5, red
                />
                <VDisk
                    VDiskId={{Domain: 2}}
                    VDiskState="OK" // severity 1, green
                    DiskSpace="Red" // severity 5, red
                    FrontQueues="Red" // severity 5, red
                />
            </>
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).not.toMatch(/_red\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
    });

    it('Should display as unavailable when no VDiskState is provided', () => {
        const {getAllByRole} = render(
            <>
                <VDisk VDiskId={{Domain: 1}} />
                <VDisk VDiskId={{Domain: 2}} VDiskState="OK" />
                <VDisk VDiskId={{Domain: 3}}                 DiskSpace="Green" />
                <VDisk VDiskId={{Domain: 4}}                                   FrontQueues="Green" />
                <VDisk VDiskId={{Domain: 5}} VDiskState="OK" DiskSpace="Green" />
                <VDisk VDiskId={{Domain: 6}} VDiskState="OK"                   FrontQueues="Green" />
                <VDisk VDiskId={{Domain: 7}}                 DiskSpace="Green" FrontQueues="Green" />
                <VDisk VDiskId={{Domain: 8}} VDiskState="OK" DiskSpace="Green" FrontQueues="Green" />
            </>
        );

        const [disk1, disk2, disk3, disk4, disk5, disk6, disk7, disk8] = getAllByRole('meter');

        // unavailable disks display with the highest severity
        expect(disk1.className).toMatch(/_red\b/i);
        expect(disk2.className).not.toMatch(/_red\b/i);
        expect(disk3.className).toMatch(/_red\b/i);
        expect(disk4.className).toMatch(/_red\b/i);
        expect(disk5.className).not.toMatch(/_red\b/i);
        expect(disk6.className).not.toMatch(/_red\b/i);
        expect(disk7.className).toMatch(/_red\b/i);
        expect(disk8.className).not.toMatch(/_red\b/i);
    });

    it('Should display replicating VDisks in OK state with a distinct color', () => {
        const {getAllByRole} = render(
            <>
                <VDisk
                    VDiskId={{Domain: 1}}
                    VDiskState="OK" // severity 1, green
                    Replicated={false}
                />
                <VDisk
                    VDiskId={{Domain: 2}}
                    VDiskState="OK" // severity 1, green
                    Replicated={true}
                />
            </>
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_blue\b/i);
        expect(disk2.className).not.toMatch(/_blue\b/i);
    });

    it('Should display replicating VDisks in a not-OK state with a regular color', () => {
        const {getAllByRole} = render(
            <>
                <VDisk
                    VDiskId={{Domain: 1}}
                    VDiskState="Initial" // severity 3, yellow
                    Replicated={false}
                    />
                <VDisk
                    VDiskId={{Domain: 2}}
                    VDiskState="PDiskError" // severity 5, red
                    Replicated={false}
                />
            </>
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_yellow\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
    });

    it('Should always display donor VDisks with a regular color', () => {
        const {getAllByRole} = render(
            <>
                <VDisk
                    VDiskId={{Domain: 1}}
                    VDiskState="OK" // severity 1, green
                    Replicated={false} // donors are always in the not replicated state since they are leftovers
                    DonorMode
                />
                <VDisk
                    VDiskId={{Domain: 2}}
                    VDiskState="Initial" // severity 3, yellow
                    Replicated={false}
                    DonorMode
                />
                <VDisk
                    VDiskId={{Domain: 3}}
                    VDiskState="PDiskError" // severity 5, red
                    Replicated={false}
                    DonorMode
                />
            </>
        );

        const [disk1, disk2, disk3] = getAllByRole('meter');

        expect(disk1.className).not.toMatch(/_blue\b/i);
        expect(disk1.className).toMatch(/_green\b/i);
        expect(disk2.className).toMatch(/_yellow\b/i);
        expect(disk3.className).toMatch(/_red\b/i);
    });
});

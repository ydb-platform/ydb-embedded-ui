import {makeVDiskLocationKey, setDonorRecipientReferences} from '../helpers';
import type {PreparedVDisk} from '../types';

describe('makeVDiskLocationKey', () => {
    test('Should build a key from all three coordinates', () => {
        const key = makeVDiskLocationKey(1, 2, 3);
        expect(key).toBe('1-2-3');
    });

    test('Should return undefined when nodeId is missing', () => {
        expect(makeVDiskLocationKey(undefined, 2, 3)).toBeUndefined();
    });

    test('Should return undefined when pDiskId is missing', () => {
        expect(makeVDiskLocationKey(1, undefined, 3)).toBeUndefined();
    });

    test('Should return undefined when vDiskSlotId is missing', () => {
        expect(makeVDiskLocationKey(1, 2, undefined)).toBeUndefined();
    });

    test('Should return undefined when all coordinates are missing', () => {
        expect(makeVDiskLocationKey(undefined, undefined, undefined)).toBeUndefined();
    });

    test('Should handle zero values as valid coordinates', () => {
        const key = makeVDiskLocationKey(0, 0, 0);
        expect(key).toBe('0-0-0');
    });
});

describe('setDonorRecipientReferences', () => {
    function makeVDisk(overrides: Partial<PreparedVDisk> = {}): PreparedVDisk {
        return {
            NodeId: undefined,
            PDiskId: undefined,
            VDiskSlotId: undefined,
            StringifiedId: undefined,
            ...overrides,
        };
    }

    function forEachFromArray(vDisks: PreparedVDisk[]) {
        return (cb: (vDisk: PreparedVDisk) => void) => {
            for (const vDisk of vDisks) {
                cb(vDisk);
            }
        };
    }

    test('Should set Recipient on a donor VDisk when referenced from another VDisk Donors array', () => {
        const donor = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-real-id',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Donors: [
                makeVDisk({
                    NodeId: 10,
                    PDiskId: 20,
                    VDiskSlotId: 30,
                    StringifiedId: 'donor-local-id',
                }),
            ],
        });

        setDonorRecipientReferences(forEachFromArray([donor, acceptor]));

        expect(donor.Recipient).toEqual({
            NodeId: 1,
            StringifiedId: 'acceptor-id',
        });
    });

    test('Should synchronize donor ref StringifiedId with the actual donor StringifiedId', () => {
        const donor = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-real-id',
        });

        const donorRef = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-local-slot-id',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Donors: [donorRef],
        });

        setDonorRecipientReferences(forEachFromArray([donor, acceptor]));

        // The nested donor ref should now have the real donor's StringifiedId
        expect(donorRef.StringifiedId).toBe('donor-real-id');
    });

    test('Should not modify donor ref StringifiedId when it already matches', () => {
        const donor = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'same-id',
        });

        const donorRef = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'same-id',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Donors: [donorRef],
        });

        setDonorRecipientReferences(forEachFromArray([donor, acceptor]));

        expect(donorRef.StringifiedId).toBe('same-id');
        expect(donor.Recipient).toEqual({
            NodeId: 1,
            StringifiedId: 'acceptor-id',
        });
    });

    test('Should not set Recipient when donor is not found in the top-level VDisks', () => {
        const donorRef = makeVDisk({
            NodeId: 99,
            PDiskId: 88,
            VDiskSlotId: 77,
            StringifiedId: 'orphan-ref',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Donors: [donorRef],
        });

        setDonorRecipientReferences(forEachFromArray([acceptor]));

        // donorRef StringifiedId should remain unchanged
        expect(donorRef.StringifiedId).toBe('orphan-ref');
    });

    test('Should skip donor refs with incomplete coordinates', () => {
        const donor = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-id',
        });

        const donorRefIncomplete = makeVDisk({
            NodeId: 10,
            PDiskId: undefined, // missing coordinate
            VDiskSlotId: 30,
            StringifiedId: 'incomplete-ref',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Donors: [donorRefIncomplete],
        });

        setDonorRecipientReferences(forEachFromArray([donor, acceptor]));

        // Donor should not get a Recipient because the ref couldn't be resolved
        expect(donor.Recipient).toBeUndefined();
        expect(donorRefIncomplete.StringifiedId).toBe('incomplete-ref');
    });

    test('Should handle VDisks with no Donors gracefully', () => {
        const vDisk1 = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'vdisk-1',
        });

        const vDisk2 = makeVDisk({
            NodeId: 4,
            PDiskId: 5,
            VDiskSlotId: 6,
            StringifiedId: 'vdisk-2',
        });

        // Should not throw
        setDonorRecipientReferences(forEachFromArray([vDisk1, vDisk2]));

        expect(vDisk1.Recipient).toBeUndefined();
        expect(vDisk2.Recipient).toBeUndefined();
    });

    test('Should handle empty VDisk list', () => {
        // Should not throw
        setDonorRecipientReferences(forEachFromArray([]));
    });

    test('Should handle multiple donors for a single acceptor', () => {
        const donor1 = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-1-real',
        });

        const donor2 = makeVDisk({
            NodeId: 11,
            PDiskId: 21,
            VDiskSlotId: 31,
            StringifiedId: 'donor-2-real',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Donors: [
                makeVDisk({
                    NodeId: 10,
                    PDiskId: 20,
                    VDiskSlotId: 30,
                    StringifiedId: 'donor-1-local',
                }),
                makeVDisk({
                    NodeId: 11,
                    PDiskId: 21,
                    VDiskSlotId: 31,
                    StringifiedId: 'donor-2-local',
                }),
            ],
        });

        setDonorRecipientReferences(forEachFromArray([donor1, donor2, acceptor]));

        expect(donor1.Recipient).toEqual({
            NodeId: 1,
            StringifiedId: 'acceptor-id',
        });
        expect(donor2.Recipient).toEqual({
            NodeId: 1,
            StringifiedId: 'acceptor-id',
        });

        // Both donor refs should have synchronized StringifiedIds
        expect(acceptor.Donors?.[0].StringifiedId).toBe('donor-1-real');
        expect(acceptor.Donors?.[1].StringifiedId).toBe('donor-2-real');
    });

    test('Should skip donor processing when acceptor VDisk is already Replicated', () => {
        const donor = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-real-id',
        });

        const donorRef = makeVDisk({
            NodeId: 10,
            PDiskId: 20,
            VDiskSlotId: 30,
            StringifiedId: 'donor-local-id',
        });

        const acceptor = makeVDisk({
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: 'acceptor-id',
            Replicated: true,
            Donors: [donorRef],
        });

        setDonorRecipientReferences(forEachFromArray([donor, acceptor]));

        // Donor should NOT get a Recipient because the acceptor is already Replicated
        expect(donor.Recipient).toBeUndefined();
        // Donor ref StringifiedId should remain unchanged
        expect(donorRef.StringifiedId).toBe('donor-local-id');
    });
});

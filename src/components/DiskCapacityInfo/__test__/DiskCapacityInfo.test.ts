import React from 'react';

import {Label} from '@gravity-ui/uikit';

import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../utils/constants';
import {
    getPDiskCapacityInfoItems,
    getStorageGroupCapacityInfoItems,
    getVDiskCapacityInfoItems,
} from '../DiskCapacityInfo';

describe('DiskCapacityInfo builders', () => {
    test('builds exact VDisk capacity values', () => {
        const items = getVDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 2_000_000_000,
                VDiskSlotUsage: 82.25,
                VDiskRawUsage: 64.5,
                GroupSizeInUnits: 0,
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            },
            {withRawUsage: true},
        );

        expect(items.map(({id, title, value}) => ({id, title, value})).slice(0, 4)).toEqual([
            {
                id: 'size',
                title: 'Size',
                value: `1 / 2${UNBREAKABLE_GAP}GB`,
            },
            {
                id: 'vdisk-slot-usage',
                title: 'VDisk Slot Usage',
                value: expect.objectContaining({
                    type: Label,
                    props: expect.objectContaining({
                        children: '82.3%',
                        theme: 'warning',
                    }),
                }),
            },
            {
                id: 'vdisk-raw-usage',
                title: 'VDisk Raw Usage',
                value: '64.5%',
            },
            {
                id: 'group-size-in-units',
                title: 'Group Size In Units',
                value: '0',
            },
        ]);
        expect(items.map(({id}) => id)).toEqual([
            'size',
            'vdisk-slot-usage',
            'vdisk-raw-usage',
            'group-size-in-units',
            'capacity-alert',
        ]);
    });

    test('keeps every VDisk item while optional scalar values are absent', () => {
        const items = getVDiskCapacityInfoItems(undefined, {withRawUsage: true});

        expect(items.map(({id}) => id)).toEqual([
            'size',
            'vdisk-slot-usage',
            'vdisk-raw-usage',
            'group-size-in-units',
            'capacity-alert',
        ]);
        expect(items.slice(0, 4).map(({value}) => value)).toEqual([
            EMPTY_DATA_PLACEHOLDER,
            EMPTY_DATA_PLACEHOLDER,
            EMPTY_DATA_PLACEHOLDER,
            EMPTY_DATA_PLACEHOLDER,
        ]);
    });

    test.each([
        ['missing', undefined],
        ['null', null],
        ['empty', ''],
        ['whitespace-only', '   '],
    ])('renders %s VDisk capacity alerts as the empty-data placeholder', (_caseName, value) => {
        const items = getVDiskCapacityInfoItems(
            {CapacityAlert: value as unknown as string},
            {withRawUsage: false},
        );

        expect(items.find(({id}) => id === 'capacity-alert')?.value).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test.each([
        [
            'VDisk',
            () =>
                getVDiskCapacityInfoItems(
                    {CapacityAlert: ECapacityAlert.LIGHTYELLOW},
                    {withRawUsage: false},
                ),
        ],
        [
            'PDisk',
            () =>
                getPDiskCapacityInfoItems(
                    {PDiskCapacityAlert: ECapacityAlert.LIGHTYELLOW},
                    {withUsage: false, withCapacityAlert: true},
                ),
        ],
        [
            'storage group',
            () =>
                getStorageGroupCapacityInfoItems({
                    Degraded: 0,
                    Read: 0,
                    Write: 0,
                    Used: 0,
                    Limit: 0,
                    DiskSpace: EFlag.Green,
                    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
                }),
        ],
    ])('renders a known %s capacity alert as plain text', (_surface, buildItems) => {
        const value = buildItems().find(({id}) => id === 'capacity-alert')?.value;

        expect(value).toBe(ECapacityAlert.LIGHTYELLOW);
    });

    test('renders an unknown capacity alert as plain text', () => {
        const items = getVDiskCapacityInfoItems(
            {CapacityAlert: 'FUTURE_ALERT'},
            {withRawUsage: false},
        );
        const value = items.find(({id}) => id === 'capacity-alert')?.value;

        expect(value).toBe('FUTURE_ALERT');
    });

    test('uses a neutral theme when VDisk Slot Usage has no recognized alert', () => {
        const items = getVDiskCapacityInfoItems(
            {
                VDiskSlotUsage: 82.25,
                CapacityAlert: 'FUTURE_ALERT',
            },
            {withRawUsage: false},
        );
        const value = items.find(({id}) => id === 'vdisk-slot-usage')?.value;

        expect(value).toEqual(
            expect.objectContaining({
                type: Label,
                props: expect.objectContaining({
                    children: '82.3%',
                    theme: 'normal',
                }),
            }),
        );
    });

    test('keeps missing VDisk Slot Usage as the plain placeholder', () => {
        const items = getVDiskCapacityInfoItems(
            {CapacityAlert: ECapacityAlert.LIGHTYELLOW},
            {withRawUsage: false},
        );
        const value = items.find(({id}) => id === 'vdisk-slot-usage')?.value;

        expect(React.isValidElement(value)).toBe(false);
        expect(value).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('uses the Whiteboard VDisk size instead of the legacy BSC size', () => {
        const [sizeItem] = getVDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 1_000_000_000,
                    SizeLimit: 22_000_000_000,
                },
            },
            {withRawUsage: false},
        );

        expect(sizeItem.value).toBe(`1 / 22${UNBREAKABLE_GAP}GB`);
    });

    test('preserves zero in the Whiteboard VDisk size', () => {
        const [sizeItem] = getVDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 0,
                    SizeLimit: 22_000_000_000,
                },
            },
            {withRawUsage: false},
        );

        expect(sizeItem.value).toBe(`0 / 22${UNBREAKABLE_GAP}GB`);
    });

    test('does not mix a partial Whiteboard VDisk size with the legacy BSC size', () => {
        const [sizeItem] = getVDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 1_000_000_000,
                },
            },
            {withRawUsage: false},
        );

        expect(sizeItem.value).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('builds exact PDisk scalar values without rendering a component', () => {
        const items = getPDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                TotalSize: 2_000_000_000,
                PDiskUsage: 75,
                NumActiveSlots: 0,
                ExpectedSlotCount: 4,
                SlotSizeInUnits: 2,
                PDiskCapacityAlert: ECapacityAlert.ORANGE,
            },
            {withUsage: true, withCapacityAlert: true},
        );

        expect(items.map(({id}) => id)).toEqual([
            'space',
            'pdisk-usage',
            'slots',
            'slot-size-in-units',
            'capacity-alert',
        ]);
        expect(items.slice(0, 4).map(({value}) => value)).toEqual([
            `1 / 2${UNBREAKABLE_GAP}GB`,
            '75%',
            '0 / 4',
            '2',
        ]);
    });

    test('uses the Whiteboard PDisk size instead of the legacy BSC size', () => {
        const [spaceItem] = getPDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                TotalSize: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 1_000_000_000,
                    TotalSize: 22_000_000_000,
                },
            },
            {withUsage: true, withCapacityAlert: true},
        );

        expect(spaceItem.value).toBe(`1 / 22${UNBREAKABLE_GAP}GB`);
    });

    test('preserves zero in the Whiteboard PDisk size', () => {
        const [spaceItem] = getPDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                TotalSize: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 0,
                    TotalSize: 22_000_000_000,
                },
            },
            {withUsage: true, withCapacityAlert: true},
        );

        expect(spaceItem.value).toBe(`0 / 22${UNBREAKABLE_GAP}GB`);
    });

    test('does not mix a partial Whiteboard PDisk size with the legacy BSC size', () => {
        const [spaceItem] = getPDiskCapacityInfoItems(
            {
                AllocatedSize: 1_000_000_000,
                TotalSize: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 1_000_000_000,
                },
            },
            {withUsage: true, withCapacityAlert: true},
        );

        expect(spaceItem.value).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('formats normalized storage-group scalar values without rendering a component', () => {
        const items = getStorageGroupCapacityInfoItems({
            Degraded: 0,
            Read: 0,
            Write: 0,
            Used: 0,
            Limit: 0,
            DiskSpace: EFlag.Green,
            MaxVDiskSlotUsage: 0.8225,
            MaxVDiskRawUsage: 0,
            CapacityAlert: 'FUTURE_ALERT',
        });

        expect(items.map(({id}) => id)).toEqual([
            'vdisk-slot-usage',
            'vdisk-raw-usage',
            'capacity-alert',
        ]);
        expect(items.find(({id}) => id === 'vdisk-slot-usage')?.value).toEqual(
            expect.objectContaining({
                type: Label,
                props: expect.objectContaining({
                    children: '82.25%',
                    theme: 'normal',
                }),
            }),
        );
        expect(items.find(({id}) => id === 'vdisk-raw-usage')?.value).toBe('0.00%');
    });
});

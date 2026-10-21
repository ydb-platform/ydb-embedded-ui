import {prepareGroupsVDisk} from '../../../store/reducers/storage/prepareGroupsDisks';
import {prepareGroupsResponse} from '../../../store/reducers/storage/utils';
import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../utils/constants';
import {
    prepareVDiskSizeFields,
    prepareWhiteboardVDiskData,
} from '../../../utils/disks/prepareDisks';
import {DiskCapacityAlertLabel} from '../../DiskStatus/DiskStatus';
import {
    CAPACITY_CONFIGURATION_HELP_TEXT,
    CAPACITY_METRICS_HELP_TEXT,
} from '../../capacityMetricsColumns/constants';
import {
    getPDiskCapacityItems,
    getStorageGroupCapacityInfoItems,
    getVDiskCapacityItems,
} from '../DiskCapacityInfo';

describe('DiskCapacityInfo builders', () => {
    test('maps capacity detail item IDs to the shared help texts', () => {
        const getNotesById = (items: Array<{id: string; note?: unknown}>) =>
            Object.fromEntries(items.map(({id, note}) => [id, note]));

        expect(getNotesById(getVDiskCapacityItems({}, {capacityMetricsEnabled: true}))).toEqual(
            expect.objectContaining({
                'vdisk-slot-usage': CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
                'vdisk-raw-usage': CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
                'group-size-in-units': CAPACITY_CONFIGURATION_HELP_TEXT.GroupSizeInUnits,
                'capacity-alert': CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
            }),
        );
        expect(getNotesById(getPDiskCapacityItems({}))).toEqual(
            expect.objectContaining({
                'pdisk-usage': CAPACITY_METRICS_HELP_TEXT.MaxPDiskUsage,
                'slot-size-in-units': CAPACITY_CONFIGURATION_HELP_TEXT.SlotSizeInUnits,
                'capacity-alert': CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
            }),
        );
        expect(getNotesById(getStorageGroupCapacityInfoItems(undefined))).toEqual(
            expect.objectContaining({
                'vdisk-slot-usage': CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
                'vdisk-raw-usage': CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
                'capacity-alert': CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
            }),
        );
    });

    test('formats VDisk capacity with two decimal places and preserves zero', () => {
        const items = getVDiskCapacityItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 2_000_000_000,
                VDiskSlotUsage: 82.25,
                VDiskRawUsage: 0,
                GroupSizeInUnits: 0,
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            },
            {capacityMetricsEnabled: true},
        );
        expect(items.find(({id}) => id === 'size')?.content).toBe(
            `1.00 / 2.00${UNBREAKABLE_GAP}GB`,
        );
        expect(items.find(({id}) => id === 'vdisk-slot-usage')?.content).toBe('82.25%');
        expect(items.find(({id}) => id === 'vdisk-raw-usage')?.content).toBe('0%');
        expect(items.find(({id}) => id === 'group-size-in-units')?.content).toBe('1 (implicit)');
    });

    test('keeps unavailable VDisk fields without treating zero as missing', () => {
        const emptyItems = getVDiskCapacityItems({}, {capacityMetricsEnabled: true});
        const fieldIds = [
            'group-size-in-units',
            'size',
            'capacity-alert',
            'vdisk-slot-usage',
            'vdisk-raw-usage',
        ];
        expect(emptyItems.map(({id}) => id)).toEqual(fieldIds);
        for (const id of ['size', 'vdisk-slot-usage', 'vdisk-raw-usage']) {
            expect(emptyItems.find((item) => item.id === id)?.content).toBe(EMPTY_DATA_PLACEHOLDER);
        }
        expect(emptyItems.find(({id}) => id === 'group-size-in-units')?.content).toBe(
            '1 (implicit)',
        );
        const items = getVDiskCapacityItems(
            {VDiskRawUsage: 0, VDiskSlotUsage: NaN, CapacityAlert: '   '},
            {capacityMetricsEnabled: true},
        );
        expect(items.map(({id}) => id)).toEqual(fieldIds);
        expect(items.find(({id}) => id === 'vdisk-slot-usage')?.content).toBe(
            EMPTY_DATA_PLACEHOLDER,
        );
        expect(items.find(({id}) => id === 'vdisk-raw-usage')?.content).toBe('0%');
    });

    test('keeps the classic size when the capacity experiment is disabled', () => {
        const items = getVDiskCapacityItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                VDiskSlotUsage: 82.25,
                WhiteboardSize: {AllocatedSize: 0, SizeLimit: 22_000_000_000},
            },
            {capacityMetricsEnabled: false},
        );
        expect(items.map(({id}) => id)).toEqual(['size']);
        expect(items[0].content).toBe(`1.00 / 4.00${UNBREAKABLE_GAP}GB`);
    });

    test('preserves zero in Whiteboard VDisk size', () => {
        const items = getVDiskCapacityItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                WhiteboardSize: {AllocatedSize: 0, SizeLimit: 22_000_000_000},
            },
            {capacityMetricsEnabled: true},
        );
        expect(items.find(({id}) => id === 'size')?.content).toBe(`0 / 22.00${UNBREAKABLE_GAP}GB`);
    });

    test('does not mix a partial Whiteboard VDisk size with BSC size', () => {
        const items = getVDiskCapacityItems(
            {
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                WhiteboardSize: {AllocatedSize: 1_000_000_000},
            },
            {capacityMetricsEnabled: true},
        );
        expect(items.find(({id}) => id === 'size')?.content).toBe(`1.00${UNBREAKABLE_GAP}GB / —`);
    });

    test.each([
        {allocated: '1000000000', slot: undefined, expected: `1.00${UNBREAKABLE_GAP}GB / —`},
        {allocated: '0', slot: undefined, expected: `0${UNBREAKABLE_GAP}GB / —`},
        {allocated: undefined, slot: '2000000000', expected: `— / 2.00${UNBREAKABLE_GAP}GB`},
        {allocated: '', slot: '2000000000', expected: `— / 2.00${UNBREAKABLE_GAP}GB`},
        {allocated: '-1', slot: '2000000000', expected: `— / 2.00${UNBREAKABLE_GAP}GB`},
        {allocated: undefined, slot: undefined, expected: EMPTY_DATA_PLACEHOLDER},
    ])('preserves known VDisk size fields: $allocated / $slot', ({allocated, slot, expected}) => {
        const data = prepareVDiskSizeFields({
            AllocatedSize: allocated,
            AvailableSize: undefined,
            SlotSize: slot,
        });
        const items = getVDiskCapacityItems(data, {capacityMetricsEnabled: false});
        expect(items.find(({id}) => id === 'size')?.content).toBe(expected);
    });

    test('does not show a total inferred from an invalid legacy allocation', () => {
        const data = prepareVDiskSizeFields({
            AllocatedSize: '-1',
            AvailableSize: '2000000000',
            SlotSize: undefined,
        });
        const items = getVDiskCapacityItems(data, {capacityMetricsEnabled: false});
        expect(items.find(({id}) => id === 'size')?.content).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test.each([false, true])(
        'preserves a partial Nodes size with capacity metrics enabled=%p',
        (capacityMetricsEnabled) => {
            const data = prepareWhiteboardVDiskData({
                VDiskId: {},
                AllocatedSize: '',
                AvailableSize: '',
                PDisk: {EnforcedDynamicSlotSize: '2000000000'},
            });
            const items = getVDiskCapacityItems(data, {capacityMetricsEnabled});

            expect(items.find(({id}) => id === 'size')?.content).toBe(
                `— / 2.00${UNBREAKABLE_GAP}GB`,
            );
        },
    );

    test.each([
        {capacityMetricsEnabled: false, expected: `1.00 / 4.00${UNBREAKABLE_GAP}GB`},
        {capacityMetricsEnabled: true, expected: `— / 2.00${UNBREAKABLE_GAP}GB`},
    ])(
        'keeps Groups size sources separate with capacity metrics enabled=$capacityMetricsEnabled',
        ({capacityMetricsEnabled, expected}) => {
            const data = prepareGroupsVDisk({
                AllocatedSize: '1000000000',
                AvailableSize: '3000000000',
                Whiteboard: {AllocatedSize: '', AvailableSize: ''},
                PDisk: {Whiteboard: {EnforcedDynamicSlotSize: '2000000000'}},
            });
            const items = getVDiskCapacityItems(data, {capacityMetricsEnabled});

            expect(items.find(({id}) => id === 'size')?.content).toBe(expected);
        },
    );

    test('renders a known PDisk capacity alert as a label', () => {
        const items = getPDiskCapacityItems({PDiskCapacityAlert: ECapacityAlert.LIGHTYELLOW});

        expect(items.find(({id}) => id === 'capacity-alert')?.content).toMatchObject({
            type: DiskCapacityAlertLabel,
            props: {value: ECapacityAlert.LIGHTYELLOW},
        });
    });

    test('shows PDisk slots from a Groups response without Whiteboard ExpectedSlotCount', () => {
        const {groups} = prepareGroupsResponse({
            StorageGroups: [
                {
                    GroupId: '1',
                    VDisks: [
                        {
                            PDisk: {
                                SlotCount: '16',
                                Whiteboard: {NumActiveSlots: 14},
                            },
                        },
                    ],
                },
            ],
        });
        const items = getPDiskCapacityItems(groups?.[0].VDisks?.[0].PDisk ?? {});

        expect(items.find(({id}) => id === 'slots')?.content).toBe('14 / 16');
    });

    test('builds PDisk capacity fields in display order with two decimal places', () => {
        const items = getPDiskCapacityItems({
            AllocatedSize: 1_000_000_000,
            TotalSize: 2_000_000_000,
            PDiskUsage: 75,
            NumActiveSlots: 0,
            ExpectedSlotCount: 4,
            SlotSizeInUnits: 2,
            PDiskCapacityAlert: ECapacityAlert.ORANGE,
        });

        expect(items.map(({id}) => id)).toEqual([
            'slot-size-in-units',
            'space',
            'capacity-alert',
            'pdisk-usage',
            'slots',
        ]);
        expect(items.filter(({id}) => id !== 'capacity-alert').map(({content}) => content)).toEqual(
            ['2', `1.00 / 2.00${UNBREAKABLE_GAP}GB`, '75.00%', '0 / 4'],
        );
    });

    test('keeps missing PDisk metrics empty while using the implicit slot unit default', () => {
        const items = getPDiskCapacityItems({});

        expect(items.find(({id}) => id === 'pdisk-usage')?.content).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(items.find(({id}) => id === 'slot-size-in-units')?.content).toBe('1 (implicit)');
        expect(items.find(({id}) => id === 'capacity-alert')?.content).toMatchObject({
            type: DiskCapacityAlertLabel,
            props: {value: undefined},
        });
    });

    test('uses the Whiteboard PDisk size instead of the legacy BSC size', () => {
        const items = getPDiskCapacityItems({
            AllocatedSize: 1_000_000_000,
            TotalSize: 4_000_000_000,
            WhiteboardSize: {
                AllocatedSize: 1_000_000_000,
                TotalSize: 22_000_000_000,
            },
        });

        expect(items.find(({id}) => id === 'space')?.content).toBe(
            `1.00 / 22.00${UNBREAKABLE_GAP}GB`,
        );
    });

    test('preserves zero in the Whiteboard PDisk size', () => {
        const items = getPDiskCapacityItems({
            AllocatedSize: 1_000_000_000,
            TotalSize: 4_000_000_000,
            WhiteboardSize: {
                AllocatedSize: 0,
                TotalSize: 22_000_000_000,
            },
        });

        expect(items.find(({id}) => id === 'space')?.content).toBe(`0 / 22.00${UNBREAKABLE_GAP}GB`);
    });

    test('does not mix a partial Whiteboard PDisk size with the legacy BSC size', () => {
        const items = getPDiskCapacityItems({
            AllocatedSize: 1_000_000_000,
            TotalSize: 4_000_000_000,
            WhiteboardSize: {
                AllocatedSize: 1_000_000_000,
            },
        });

        expect(items.find(({id}) => id === 'space')?.content).toBe(`1.00${UNBREAKABLE_GAP}GB / —`);
    });

    test('uses legacy PDisk size when Whiteboard size is disabled', () => {
        const items = getPDiskCapacityItems(
            {
                AllocatedSize: 40_000_000_000,
                TotalSize: 100_000_000_000,
                WhiteboardSize: {TotalSize: 22_000_000_000},
            },
            {useWhiteboardSize: false},
        );

        expect(items.find(({id}) => id === 'space')?.content).toBe(
            `40.00 / 100.00${UNBREAKABLE_GAP}GB`,
        );
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
            'capacity-alert',
            'vdisk-slot-usage',
            'vdisk-raw-usage',
        ]);
        expect(items.find(({id}) => id === 'vdisk-slot-usage')?.content).toBe('82.25%');
        expect(items.find(({id}) => id === 'capacity-alert')?.content).toEqual(
            expect.objectContaining({
                type: DiskCapacityAlertLabel,
                props: expect.objectContaining({
                    value: 'FUTURE_ALERT',
                }),
            }),
        );
        expect(items.find(({id}) => id === 'vdisk-raw-usage')?.content).toBe('0%');
    });
});

import {prepareGroupsVDisk} from '../../../store/reducers/storage/prepareGroupsDisks';
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
    getPDiskCapacityInfoItems,
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
        expect(
            getNotesById(
                getPDiskCapacityInfoItems(undefined, {
                    withUsage: true,
                    withCapacityAlert: true,
                }),
            ),
        ).toEqual(
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

    test('renders a known PDisk capacity alert as plain text', () => {
        const items = getPDiskCapacityInfoItems(
            {PDiskCapacityAlert: ECapacityAlert.LIGHTYELLOW},
            {withUsage: false, withCapacityAlert: true},
        );

        expect(items.find(({id}) => id === 'capacity-alert')?.value).toBe(
            ECapacityAlert.LIGHTYELLOW,
        );
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

    test('keeps missing PDisk metrics empty while using the implicit slot unit default', () => {
        const items = getPDiskCapacityInfoItems(undefined, {
            withUsage: true,
            withCapacityAlert: true,
        });

        expect(items.find(({id}) => id === 'pdisk-usage')?.value).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(items.find(({id}) => id === 'slot-size-in-units')?.value).toBe('1 (implicit)');
        expect(items.find(({id}) => id === 'capacity-alert')?.value).toBe(EMPTY_DATA_PLACEHOLDER);
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

        expect(spaceItem.value).toBe(`1${UNBREAKABLE_GAP}GB / —`);
    });

    test('uses legacy PDisk size when Whiteboard size is disabled', () => {
        const [spaceItem] = getPDiskCapacityInfoItems(
            {
                AllocatedSize: 40_000_000_000,
                TotalSize: 100_000_000_000,
                WhiteboardSize: {TotalSize: 22_000_000_000},
            },
            {
                withUsage: false,
                withCapacityAlert: false,
                fixedDecimalPlaces: 2,
                useWhiteboardSize: false,
            },
        );

        expect(spaceItem.value).toBe(`40.00 / 100.00${UNBREAKABLE_GAP}GB`);
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
        expect(items.find(({id}) => id === 'vdisk-slot-usage')?.value).toBe('82.25%');
        expect(items.find(({id}) => id === 'capacity-alert')?.value).toEqual(
            expect.objectContaining({
                type: DiskCapacityAlertLabel,
                props: expect.objectContaining({
                    value: 'FUTURE_ALERT',
                }),
            }),
        );
        expect(items.find(({id}) => id === 'vdisk-raw-usage')?.value).toBe('0%');
    });
});

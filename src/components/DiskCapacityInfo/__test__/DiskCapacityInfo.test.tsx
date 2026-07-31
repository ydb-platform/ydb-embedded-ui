import {render, screen, within} from '@testing-library/react';

import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../utils/constants';
import {InfoViewer} from '../../InfoViewer';
import {YDBDefinitionList} from '../../YDBDefinitionList/YDBDefinitionList';
import {
    getPDiskCapacityInfoItems,
    getStorageGroupCapacityInfoItems,
    getVDiskCapacityInfoItems,
    toDefinitionListItems,
    toInfoViewerItems,
} from '../DiskCapacityInfo';

describe('DiskCapacityInfo', () => {
    test('renders exact VDisk capacity labels and values through the definition-list adapter', () => {
        render(
            <YDBDefinitionList
                items={toDefinitionListItems(
                    getVDiskCapacityInfoItems(
                        {
                            AllocatedSize: 1_000_000_000,
                            SizeLimit: 2_000_000_000,
                            VDiskSlotUsage: 82.25,
                            VDiskRawUsage: 64.5,
                            GroupSizeInUnits: 0,
                            CapacityAlert: ECapacityAlert.LIGHTYELLOW,
                        },
                        {withRawUsage: true},
                    ),
                )}
            />,
        );

        expect(screen.getByText('Size')).toBeVisible();
        expect(
            screen.getByText(`1 / 2${UNBREAKABLE_GAP}GB`, {normalizer: (value) => value}),
        ).toBeVisible();
        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('82.3%')).toBeVisible();
        expect(screen.getByText('VDisk Raw Usage')).toBeVisible();
        expect(screen.getByText('64.5%')).toBeVisible();
        expect(screen.getByText('Group Size In Units')).toBeVisible();
        expect(screen.getByText('0')).toBeVisible();
        expect(screen.getByText('LIGHT_YELLOW')).toBeVisible();
    });

    test('keeps every enabled VDisk row visible when optional fields are absent', () => {
        render(
            <YDBDefinitionList
                items={toDefinitionListItems(
                    getVDiskCapacityInfoItems(undefined, {withRawUsage: true}),
                )}
            />,
        );

        expect(screen.getByText('Size')).toBeVisible();
        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('VDisk Raw Usage')).toBeVisible();
        expect(screen.getByText('Group Size In Units')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getAllByText(EMPTY_DATA_PLACEHOLDER)).toHaveLength(5);
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

    test('renders PDisk capacity values and notes through the InfoViewer adapter', () => {
        const {container} = render(
            <InfoViewer
                info={toInfoViewerItems(
                    getPDiskCapacityInfoItems(
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
                    ),
                )}
            />,
        );

        expect(screen.getByText('Space')).toBeVisible();
        expect(
            screen.getByText(`1 / 2${UNBREAKABLE_GAP}GB`, {normalizer: (value) => value}),
        ).toBeVisible();
        expect(screen.getByText('PDisk Usage')).toBeVisible();
        expect(screen.getByText('75%')).toBeVisible();
        expect(screen.getByText('Slots')).toBeVisible();
        expect(screen.getByText('0 / 4')).toBeVisible();
        expect(screen.getByText('Slot Size In Units')).toBeVisible();
        expect(screen.getByText('2')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getByText('ORANGE')).toBeVisible();
        expect(container.querySelectorAll('.g-help-mark')).toHaveLength(2);
    });

    test('formats normalized storage-group percentages and explicit unknown alert text', () => {
        render(
            <YDBDefinitionList
                items={toDefinitionListItems(
                    getStorageGroupCapacityInfoItems({
                        Degraded: 0,
                        Read: 0,
                        Write: 0,
                        Used: 0,
                        Limit: 0,
                        DiskSpace: EFlag.Green,
                        MaxVDiskSlotUsage: 0.8225,
                        MaxVDiskRawUsage: 0,
                        CapacityAlert: 'FUTURE_ALERT',
                    }),
                )}
            />,
        );

        expect(screen.getByText('82.25%')).toBeVisible();
        expect(screen.getByText('0.00%')).toBeVisible();
        expect(screen.getByText('FUTURE_ALERT')).toBeVisible();
    });

    test('keeps every storage-group capacity row visible when optional fields are absent', () => {
        const {container} = render(
            <InfoViewer info={toInfoViewerItems(getStorageGroupCapacityInfoItems(undefined))} />,
        );

        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('VDisk Raw Usage')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getAllByText(EMPTY_DATA_PLACEHOLDER)).toHaveLength(3);

        const rows = container.querySelectorAll('.info-viewer__row');
        expect(rows).toHaveLength(3);
        expect(within(rows[2] as HTMLElement).getByText(EMPTY_DATA_PLACEHOLDER)).toBeVisible();
    });
});

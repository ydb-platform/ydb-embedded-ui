import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {TitleWithHelpMark} from '../../TitleWithHelpmark/TitleWithHelpmark';
import {
    getCapacityAlertColumn,
    getNormalizedOccupancyColumn,
    getPDiskUsageColumn,
    getVDiskRawUsageColumn,
    getVDiskSlotUsageColumn,
} from '../columns';
import {CAPACITY_METRICS_COLUMN_TITLES, CAPACITY_METRICS_HELP_TEXT} from '../constants';

describe('capacityMetricsColumns', () => {
    test.each([
        [
            'PDisk Usage',
            getPDiskUsageColumn(),
            CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage,
            CAPACITY_METRICS_HELP_TEXT.MaxPDiskUsage,
        ],
        [
            'VDisk Slot Usage',
            getVDiskSlotUsageColumn(),
            CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        ],
        [
            'VDisk Raw Usage',
            getVDiskRawUsageColumn(),
            CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        ],
        [
            'Normalized Occupancy',
            getNormalizedOccupancyColumn(),
            CAPACITY_METRICS_COLUMN_TITLES.MaxNormalizedOccupancy,
            CAPACITY_METRICS_HELP_TEXT.MaxNormalizedOccupancy,
        ],
        [
            'Capacity Alert',
            getCapacityAlertColumn(),
            CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
            CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        ],
    ])('maps the %s column title to its shared help text', (_name, column, header, note) => {
        expect(column.header).toEqual(
            expect.objectContaining({
                type: TitleWithHelpMark,
                props: expect.objectContaining({header, note}),
            }),
        );
    });

    test.each([
        ['missing', undefined],
        ['null', null],
        ['empty', ''],
        ['whitespace-only', '   '],
    ])('renders %s capacity alerts as the empty-data placeholder', (_caseName, value) => {
        const column = getCapacityAlertColumn();
        const result = column.render?.({row: {CapacityAlert: value}} as never);

        expect(result).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test.each(['LIGHT_YELLOW', 'FUTURE_ALERT'])(
        'keeps non-empty capacity alert %s',
        (capacityAlert) => {
            const column = getCapacityAlertColumn();
            const result = column.render?.({row: {CapacityAlert: capacityAlert}} as never);

            expect(result).toBe(capacityAlert);
        },
    );
});

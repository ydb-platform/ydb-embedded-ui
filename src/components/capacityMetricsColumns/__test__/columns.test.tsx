import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {getCapacityAlertColumn} from '../columns';

describe('capacityMetricsColumns', () => {
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

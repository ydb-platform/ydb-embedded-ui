import {ECapacityAlert} from '../../../../../types/api/enums';
import {SPACE_LEGEND_STORAGE_KEY, getSpaceLegendSelection} from '../getSpaceLegendSelection';

describe('getSpaceLegendSelection', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    test('returns default inactive items without persisting them during read', () => {
        expect(getSpaceLegendSelection()).toEqual(
            new Set([ECapacityAlert.GREEN, ECapacityAlert.CYAN]),
        );
        expect(sessionStorage.getItem(SPACE_LEGEND_STORAGE_KEY)).toBeNull();
    });
});

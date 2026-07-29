import {ECapacityAlert} from '../../../../../types/api/enums';
import {
    SPACE_LEGEND_CHANGE_EVENT,
    SPACE_LEGEND_STORAGE_KEY,
    getSpaceLegendSelection,
    saveSpaceLegendSelection,
} from '../getSpaceLegendSelection';

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

    test('restores only valid inactive capacity alerts', () => {
        sessionStorage.setItem(
            SPACE_LEGEND_STORAGE_KEY,
            JSON.stringify([ECapacityAlert.RED, 'INVALID']),
        );

        expect(getSpaceLegendSelection()).toEqual(new Set([ECapacityAlert.RED]));
    });

    test('persists inactive alerts and emits the shared change event', () => {
        const listener = jest.fn();
        window.addEventListener(SPACE_LEGEND_CHANGE_EVENT, listener);

        saveSpaceLegendSelection(new Set([ECapacityAlert.GREEN]));

        expect(JSON.parse(sessionStorage.getItem(SPACE_LEGEND_STORAGE_KEY) ?? '[]')).toEqual([
            ECapacityAlert.GREEN,
        ]);
        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(SPACE_LEGEND_CHANGE_EVENT, listener);
    });
});

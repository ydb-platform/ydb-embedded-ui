import {ThemeProvider} from '@gravity-ui/uikit';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {ECapacityAlert} from '../../../../../types/api/enums';
import {AllLegend} from '../AllLegend';
import {
    SPACE_LEGEND_CHANGE_EVENT,
    SPACE_LEGEND_STORAGE_KEY,
    getSpaceLegendSelection,
    saveSpaceLegendSelection,
} from '../getSpaceLegendSelection';

describe('AllLegend', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    test('defaults to every capacity alert except Green and Cyan', () => {
        render(
            <ThemeProvider>
                <AllLegend />
            </ThemeProvider>,
        );

        expect(screen.getByRole('combobox')).toHaveTextContent(
            'Capacity alerts:Except Green & Cyan',
        );
    });

    test('restores persisted inactive capacity alerts in the visible summary', () => {
        sessionStorage.setItem(SPACE_LEGEND_STORAGE_KEY, JSON.stringify([ECapacityAlert.RED]));

        render(
            <ThemeProvider>
                <AllLegend />
            </ThemeProvider>,
        );

        expect(screen.getByRole('combobox')).toHaveTextContent('Capacity alerts:Except Red');
    });

    test('updates the visible summary when the shared Space selection changes', () => {
        render(
            <ThemeProvider>
                <AllLegend />
            </ThemeProvider>,
        );

        act(() => {
            saveSpaceLegendSelection(new Set([ECapacityAlert.RED]));
        });

        expect(screen.getByRole('combobox')).toHaveTextContent('Capacity alerts:Except Red');
    });

    test('persists the complementary inactive values after an update', async () => {
        const user = userEvent.setup();
        const listener = jest.fn();
        window.addEventListener(SPACE_LEGEND_CHANGE_EVENT, listener);

        render(
            <ThemeProvider>
                <AllLegend />
            </ThemeProvider>,
        );

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByText('Red'));

        expect(getSpaceLegendSelection()).toEqual(
            new Set([ECapacityAlert.GREEN, ECapacityAlert.CYAN, ECapacityAlert.RED]),
        );
        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(SPACE_LEGEND_CHANGE_EVENT, listener);
    });
});

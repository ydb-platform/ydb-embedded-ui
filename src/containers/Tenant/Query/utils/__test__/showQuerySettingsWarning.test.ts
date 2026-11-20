import {toaster} from '../../../../../utils/createToast';
import {showQuerySettingsWarning} from '../showQuerySettingsWarning';

afterEach(() => {
    toaster.removeAll();
    jest.useRealTimers();
});

test('replaces a changed warning with a fresh timer and leaves repeats alone', () => {
    jest.useFakeTimers({now: 0});
    const listener = jest.fn();
    const unsubscribe = toaster.subscribe(listener);

    try {
        showQuerySettingsWarning('History write failed');
        const [[first]] = listener.mock.lastCall ?? [];

        jest.advanceTimersByTime(4900);
        showQuerySettingsWarning('Saved queries write failed');
        const [warnings] = listener.mock.lastCall ?? [];

        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatchObject({
            title: 'Saved queries write failed',
            autoHiding: 5000,
            addedAt: 4900,
        });
        expect(warnings[0].name).not.toBe(first.name);

        listener.mockClear();
        showQuerySettingsWarning('Saved queries write failed');
        expect(listener).not.toHaveBeenCalled();
    } finally {
        unsubscribe();
    }
});

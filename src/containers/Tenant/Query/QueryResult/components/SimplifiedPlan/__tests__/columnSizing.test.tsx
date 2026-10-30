import {ThemeProvider} from '@gravity-ui/uikit';
import {act, fireEvent, render} from '@testing-library/react';

import {SimplifiedPlan} from '../SimplifiedPlan';

const stylesheet = document.createElement('style');
stylesheet.textContent = '.ydb-query-simplified-plan {padding: 0 24px 16px 16px}';
beforeEach(() => document.head.append(stylesheet));
afterEach(() => stylesheet.remove());

test('uses the final pointer position when move and release are batched', () => {
    const onColumnSizingChange = jest.fn();
    const {container} = render(
        <ThemeProvider theme="light">
            <SimplifiedPlan
                plan={[{name: 'Scan', operationParams: {}}]}
                onColumnSizingChange={onColumnSizingChange}
            />
        </ThemeProvider>,
    );
    const handle = container.querySelectorAll('.gt-resize-handle')[1];
    fireEvent.mouseDown(handle, {clientX: 100});
    act(() => {
        for (const clientX of [110, 120, 130, 140]) {
            document.dispatchEvent(new MouseEvent('mousemove', {clientX, bubbles: true}));
        }
        document.dispatchEvent(new MouseEvent('mouseup', {clientX: 140, bubbles: true}));
    });
    expect(onColumnSizingChange).toHaveBeenLastCalledWith(expect.objectContaining({aCpu: 129}));
});

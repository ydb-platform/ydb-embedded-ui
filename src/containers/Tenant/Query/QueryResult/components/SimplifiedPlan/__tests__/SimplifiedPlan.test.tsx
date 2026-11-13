import {act, fireEvent, render} from '@testing-library/react';

import {SimplifiedPlan} from '../SimplifiedPlan';

test('resizes with native table state, including batched move/up and reset', () => {
    const {container} = render(<SimplifiedPlan plan={[{name: 'Scan', operationParams: {}}]} />);
    const header = container.querySelectorAll('th')[1];
    const handle = header.querySelector('.gt-resize-handle');
    if (!handle) {
        throw new Error('Missing column resize handle');
    }
    fireEvent.mouseDown(handle, {clientX: 100});
    for (const clientX of [110, 120, 130, 140]) {
        fireEvent.mouseMove(document, {clientX});
    }
    expect(header).toHaveStyle({width: '129px'});
    fireEvent.mouseUp(document, {clientX: 140});

    fireEvent.mouseDown(handle, {clientX: 140});
    act(() => {
        fireEvent.mouseMove(document, {clientX: 160});
        fireEvent.mouseUp(document, {clientX: 180});
    });
    expect(header).toHaveStyle({width: '169px'});
    fireEvent.doubleClick(handle);
    expect(header).toHaveStyle({width: '89px'});
});

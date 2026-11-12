import {act, fireEvent, render} from '@testing-library/react';

import {SimplifiedPlan} from '../SimplifiedPlan';

test('resizes locally and commits the final width once, including batched move/up and reset', () => {
    const onColumnSizingChange = jest.fn();
    const {container} = render(
        <SimplifiedPlan
            plan={[{name: 'Scan', operationParams: {}}]}
            columnSizing={{name: 500}}
            onColumnSizingChange={onColumnSizingChange}
        />,
    );
    const header = container.querySelectorAll('th')[1];
    const handle = header.querySelector('.gt-resize-handle');
    if (!handle) {
        throw new Error('Missing column resize handle');
    }
    fireEvent.mouseDown(handle, {clientX: 100});
    for (const clientX of [110, 120, 130, 140]) {
        fireEvent.mouseMove(document, {clientX});
    }
    expect(onColumnSizingChange).not.toHaveBeenCalled();
    expect(header).toHaveStyle({width: '129px'});
    fireEvent.mouseUp(document, {clientX: 140});
    expect(onColumnSizingChange.mock.calls).toEqual([[{name: 500, aCpu: 129}]]);

    onColumnSizingChange.mockClear();
    fireEvent.mouseDown(handle, {clientX: 140});
    act(() => {
        fireEvent.mouseMove(document, {clientX: 160});
        fireEvent.mouseUp(document, {clientX: 180});
    });
    expect(header).toHaveStyle({width: '169px'});
    expect(onColumnSizingChange.mock.calls).toEqual([[{name: 500, aCpu: 169}]]);
    fireEvent.doubleClick(handle);
    expect(header).toHaveStyle({width: '89px'});
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({name: 500});
});

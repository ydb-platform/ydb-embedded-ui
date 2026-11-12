import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {ExecutionPlan} from '../components/ExecutionPlan/ExecutionPlan';

jest.mock('../../../../../store/reducers/planToSvg', () => ({
    planToSvgApi: {
        usePlanToSvgQueryQuery: () => ({
            currentData: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"/>',
            isFetching: false,
            refetch: jest.fn(),
        }),
    },
}));

test('creates the viewer only on demand and releases URLs when the image changes', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    let created = 0;
    const create = jest.fn((blob: Blob) => `blob:${blob.type}/${++created}`);
    const revoke = jest.fn();
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    const plan = {meta: {type: 'query' as const, version: '0.2'}};
    const view = render(
        <ThemeProvider theme="light">
            <ExecutionPlan database="/local" plan={plan} />
        </ThemeProvider>,
    );
    try {
        expect(create.mock.calls.map(([blob]) => blob.type)).toEqual(['image/svg+xml']);
        fireEvent.click(screen.getByRole('button', {name: 'Open in new tab'}));
        expect(create.mock.calls.map(([blob]) => blob.type)).toEqual([
            'image/svg+xml',
            'text/html',
        ]);
        fireEvent.click(screen.getByRole('button', {name: 'Open in new tab'}));
        expect(create).toHaveBeenCalledTimes(2);
        expect(open).toHaveBeenLastCalledWith('blob:text/html/2', '_blank', 'noopener,noreferrer');
        view.rerender(
            <ThemeProvider theme="dark">
                <ExecutionPlan database="/local" plan={plan} />
            </ThemeProvider>,
        );
        expect(revoke.mock.calls.flat()).toEqual(['blob:image/svg+xml/1', 'blob:text/html/2']);
        expect(create).toHaveBeenCalledTimes(3);
        view.unmount();
        expect(revoke).toHaveBeenLastCalledWith('blob:image/svg+xml/3');
    } finally {
        view.unmount();
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
        open.mockRestore();
    }
});

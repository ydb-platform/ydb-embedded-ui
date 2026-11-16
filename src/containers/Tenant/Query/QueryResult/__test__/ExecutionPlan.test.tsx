import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

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

test('prepares a native viewer link and releases both URLs when the image changes', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    let created = 0;
    const create = jest.fn((blob: Blob) => `blob:${blob.type}/${++created}`);
    const revoke = jest.fn();
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    const plan = {meta: {type: 'query' as const, version: '0.2'}};
    const view = render(
        <ThemeProvider theme="light">
            <ExecutionPlan database="/local" plan={plan} />
        </ThemeProvider>,
    );
    try {
        expect(create.mock.calls.map(([blob]) => blob.type)).toEqual([
            'image/svg+xml',
            'text/html',
        ]);
        const link = screen.getByRole('link', {name: 'Open in new tab'});
        expect(link).toHaveAttribute('href', 'blob:text/html/2');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        view.rerender(
            <ThemeProvider theme="light">
                <ExecutionPlan database="/local" plan={plan} />
            </ThemeProvider>,
        );
        expect(create).toHaveBeenCalledTimes(2);
        view.rerender(
            <ThemeProvider theme="dark">
                <ExecutionPlan database="/local" plan={plan} />
            </ThemeProvider>,
        );
        expect(revoke.mock.calls.flat()).toEqual(['blob:image/svg+xml/1', 'blob:text/html/2']);
        expect(create).toHaveBeenCalledTimes(4);
        expect(screen.getByRole('link', {name: 'Open in new tab'})).toHaveAttribute(
            'href',
            'blob:text/html/4',
        );
        view.unmount();
        expect(revoke.mock.calls.flat()).toEqual([
            'blob:image/svg+xml/1',
            'blob:text/html/2',
            'blob:image/svg+xml/3',
            'blob:text/html/4',
        ]);
    } finally {
        view.unmount();
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
    }
});

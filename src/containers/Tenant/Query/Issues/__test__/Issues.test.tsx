import {fireEvent, render, screen} from '@testing-library/react';

import {ResultIssues} from '../Issues';

describe('ResultIssues', () => {
    beforeEach(() => {
        window.ydbEditor = {} as NonNullable<typeof window.ydbEditor>;
    });

    afterEach(() => {
        window.ydbEditor = undefined;
    });

    test('renders a Query Settings pragma position without an editor link', () => {
        render(
            <ResultIssues
                data={{
                    error: {message: 'Invalid pragma'},
                    issues: [
                        {
                            message: 'Unknown pragma',
                            position: {
                                row: 1,
                                column: 4,
                                file: 'query-settings-pragmas',
                            },
                        },
                    ],
                }}
            />,
        );

        fireEvent.click(screen.getByRole('button', {name: 'Show details'}));

        const position = screen.getByText('1:4');
        expect(position).toBeVisible();
        expect(position.closest('a')).toBeNull();
    });
});

import {render, screen} from '@testing-library/react';

import {EditorButton} from '../EditorButton';

jest.mock('@gravity-ui/uikit', () => {
    const actual = jest.requireActual('@gravity-ui/uikit');

    return {
        ...actual,
        Icon: ({data}: {data: {name?: string}}) => (
            <span data-testid="button-icon">{data.name}</span>
        ),
    };
});

describe('EditorButton', () => {
    test('uses the filled play icon for Run', () => {
        render(<EditorButton.Run />);

        expect(screen.getByTestId('button-icon')).toHaveTextContent('PlayFill');
    });

    test('uses the filled stop icon for Stop', () => {
        render(<EditorButton.Stop />);

        expect(screen.getByTestId('button-icon')).toHaveTextContent('StopFill');
    });

    test('keeps the binoculars icon for Explain', () => {
        render(<EditorButton.Explain />);

        expect(screen.getByTestId('button-icon')).toHaveTextContent('Binoculars');
    });
});

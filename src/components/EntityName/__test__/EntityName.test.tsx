import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {EntityName} from '../EntityName';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
    if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
        Reflect.deleteProperty(navigator, 'clipboard');
    }
});

describe('EntityName', () => {
    test('uses its own BEM block', () => {
        const {container} = render(<EntityName name="node-1.example.net" />);

        expect(container.firstElementChild).toHaveClass('ydb-entity-name');
        expect(container.firstElementChild).not.toHaveClass('entity-status');
    });

    test('owns the leading content layout', () => {
        render(<EntityName name="node-1.example.net" leadingContent={<span>Status</span>} />);

        expect(screen.getByText('Status').parentElement).toHaveClass(
            'ydb-entity-name__leading-content',
        );
    });

    test('renders a copyable name without status markup', async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText},
        });

        const {container} = render(<EntityName name="node-1.example.net" hasClipboardButton />);

        expect(screen.getByText('node-1.example.net')).toBeVisible();
        expect(container.querySelector('.ydb-status-color')).toBeNull();
        expect(container.querySelector('.ydb-status-icon__status-icon')).toBeNull();
        fireEvent.click(screen.getByRole('button', {name: /copy/i}));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('node-1.example.net'));
    });

    test('renders custom content inside an internal link and copies the raw name', async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText},
        });

        render(
            <MemoryRouter>
                <EntityName
                    name="raw-name"
                    path="/node/1"
                    renderName={() => <span>Visible name</span>}
                    hasClipboardButton
                />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', {name: 'Visible name'})).toHaveAttribute('href', '/node/1');
        fireEvent.click(screen.getByRole('button', {name: /copy/i}));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('raw-name'));
    });

    test('renders an external link through UIKit Link', () => {
        render(<EntityName name="External" path="https://example.test" externalLink />);

        expect(screen.getByRole('link', {name: 'External'})).toHaveAttribute(
            'href',
            'https://example.test',
        );
    });
});

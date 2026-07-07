import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {
    TreeKeyProvider,
    useTreeKey,
} from '../../../containers/Tenant/ObjectSummary/UpdateTreeContext';
import {LinkToSchemaObject} from '../LinkToSchemaObject';

jest.mock('../../../containers/Tenant/Diagnostics/DiagnosticsPages', () => ({
    useDiagnosticsPageLinkGetter: () => (_tab: string, params?: {schema?: string}) => {
        return `/tenant?schema=${encodeURIComponent(params?.schema ?? '')}`;
    },
}));

jest.mock('../../../containers/Tenant/utils/useNavigationV2Enabled', () => ({
    useNavigationV2Enabled: () => false,
}));

function TreeKeyValue() {
    return <span data-testid="tree-key">{useTreeKey()}</span>;
}

function renderLink(onClick?: React.ComponentProps<typeof LinkToSchemaObject>['onClick']) {
    render(
        <MemoryRouter>
            <TreeKeyProvider>
                <TreeKeyValue />
                <LinkToSchemaObject path="/Root/Table" onClick={onClick}>
                    Table
                </LinkToSchemaObject>
            </TreeKeyProvider>
        </MemoryRouter>,
    );
}

function renderLinkWithoutTreeProvider() {
    render(
        <MemoryRouter>
            <LinkToSchemaObject path="/Root/Table">Table</LinkToSchemaObject>
        </MemoryRouter>,
    );
}

describe('LinkToSchemaObject', () => {
    test('refreshes schema tree on internal navigation click', () => {
        renderLink();

        fireEvent.click(screen.getByRole('link', {name: 'Table'}), {button: 0});

        expect(screen.getByTestId('tree-key')).toHaveTextContent('/Root/Table');
    });

    test.each([
        ['ctrl click', {button: 0, ctrlKey: true}],
        ['middle click', {button: 1}],
    ])('does not refresh schema tree on %s', (_name, eventInit) => {
        renderLink();

        fireEvent.click(screen.getByRole('link', {name: 'Table'}), eventInit);

        expect(screen.getByTestId('tree-key')).toBeEmptyDOMElement();
    });

    test('does not refresh schema tree when click is prevented', () => {
        renderLink((event) => {
            event.preventDefault();
        });

        fireEvent.click(screen.getByRole('link', {name: 'Table'}), {button: 0});

        expect(screen.getByTestId('tree-key')).toBeEmptyDOMElement();
    });

    test('renders outside schema tree context', () => {
        renderLinkWithoutTreeProvider();

        expect(screen.getByRole('link', {name: 'Table'})).toHaveAttribute(
            'href',
            '/tenant?schema=%2FRoot%2FTable',
        );
    });
});

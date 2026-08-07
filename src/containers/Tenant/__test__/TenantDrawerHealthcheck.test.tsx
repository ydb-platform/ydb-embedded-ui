import React from 'react';

import {render, screen} from '@testing-library/react';

import type {SelfCheckResult} from '../../../types/api/healthcheck';
import {TenantDrawerHealthcheck} from '../TenantDrawerHealthcheck';

let mockHealthcheckStatus: SelfCheckResult | undefined;

jest.mock('../../../components/Drawer', () => ({
    DrawerWrapper: ({title}: {title?: React.ReactNode}) => <div>{title}</div>,
}));

jest.mock('../../../utils/hooks', () => ({
    useTypedSelector: () => mockHealthcheckStatus,
}));

jest.mock('../TenantContext', () => ({
    useCurrentSchema: () => ({database: '/Root/database'}),
}));

jest.mock('../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        handleHealthcheckViewChange: jest.fn(),
        handleIssuesFilterChange: jest.fn(),
        handleShowHealthcheckChange: jest.fn(),
        showHealthcheck: true,
    }),
}));

describe('TenantDrawerHealthcheck', () => {
    test('reserves the status row height while healthcheck data is loading', () => {
        mockHealthcheckStatus = undefined;

        render(
            <TenantDrawerHealthcheck>
                <div>Tenant content</div>
            </TenantDrawerHealthcheck>,
        );

        const title = screen.getByText('Healthcheck Dashboard');
        const statusRow = title.nextElementSibling;

        expect(statusRow).toHaveStyle({
            minHeight: 'var(--g-text-body-1-line-height)',
        });
    });
});

import {CircleCheck, CircleXmark, Flame, Ghost, TriangleExclamation} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import type {IconData} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import {SelfCheckResult} from '../../../../../../types/api/healthcheck';
import {HealthcheckPreview} from '../HealthcheckPreview';

const mockUseGetHealthcheckInfoQuery = jest.fn();
const mockHandleShowHealthcheckChange = jest.fn();

jest.mock('../../../../../../store/reducers/healthcheckInfo/healthcheckInfo', () => ({
    healthcheckApi: {
        useGetHealthcheckInfoQuery: (...args: unknown[]) => mockUseGetHealthcheckInfoQuery(...args),
    },
}));

jest.mock('../../../../../../utils/hooks', () => ({
    useAutoRefreshInterval: () => [0, jest.fn()],
}));

jest.mock('../../../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        handleShowHealthcheckChange: mockHandleShowHealthcheckChange,
    }),
}));

const compactStatusCases = [
    {
        status: SelfCheckResult.UNSPECIFIED,
        title: 'Unspecified',
        theme: 'unknown',
        icon: Ghost,
        emergency: false,
    },
    {
        status: SelfCheckResult.GOOD,
        title: 'Good',
        theme: 'success',
        icon: CircleCheck,
        emergency: false,
    },
    {
        status: SelfCheckResult.DEGRADED,
        title: 'Degraded',
        theme: 'warning',
        icon: TriangleExclamation,
        emergency: false,
    },
    {
        status: SelfCheckResult.MAINTENANCE_REQUIRED,
        title: 'Maintenance required',
        theme: 'danger',
        icon: Flame,
        emergency: false,
    },
    {
        status: SelfCheckResult.EMERGENCY,
        title: 'Emergency',
        theme: 'danger',
        icon: CircleXmark,
        emergency: true,
    },
] as const;

function getIconMarkup(icon: IconData) {
    const {container, unmount} = render(<Icon data={icon} size={12} />);
    const markup = container.querySelector('svg')?.innerHTML;
    unmount();
    return markup;
}

function renderPreview(status: SelfCheckResult, compact = true) {
    mockUseGetHealthcheckInfoQuery.mockReturnValue({
        currentData: {
            self_check_result: status,
            issue_log: [
                {
                    id: 'issue-1',
                    status: 'YELLOW',
                    message: 'Healthcheck issue',
                },
            ],
        },
        error: undefined,
        isFetching: false,
    });

    return render(<HealthcheckPreview database="/Root/database" compact={compact} />);
}

describe('HealthcheckPreview', () => {
    test.each(compactStatusCases)(
        'renders the approved compact $status status',
        ({status, title, theme, icon, emergency}) => {
            renderPreview(status);

            const label = screen.getByText(new RegExp(`^${title}:`)).closest('.g-label');

            expect(label).toHaveClass(`g-label_theme_${theme}`);
            expect(label?.querySelector('svg')?.innerHTML).toBe(getIconMarkup(icon));
            if (emergency) {
                expect(label).toHaveClass('ydb-healthcheck-preview__compact-status_emergency');
            } else {
                expect(label).not.toHaveClass('ydb-healthcheck-preview__compact-status_emergency');
            }
        },
    );

    test.each([
        [SelfCheckResult.DEGRADED, 'warning'],
        [SelfCheckResult.MAINTENANCE_REQUIRED, 'danger'],
    ] as const)('uses the approved %s Alert theme', (status, theme) => {
        const {container} = renderPreview(status, false);

        expect(container.querySelector('.ydb-healthcheck-preview')).toHaveClass(
            `g-card_theme_${theme}`,
        );
    });
});

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import type {SelfCheckResult} from '../../../types/api/healthcheck';
import {HealthcheckStatus} from '../HealthcheckStatus';

describe('HealthcheckStatus', () => {
    test('renders the unspecified status for unsupported self-check results', () => {
        render(
            <ThemeProvider theme="light">
                <HealthcheckStatus status={'FUTURE_RESULT' as SelfCheckResult} />
            </ThemeProvider>,
        );

        expect(screen.getByText('Unspecified')).toBeVisible();
    });
});

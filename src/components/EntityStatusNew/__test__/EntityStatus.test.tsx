import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import {EFlag} from '../../../types/api/enums';
import {EntityStatus} from '../EntityStatus';

const statusCases = [
    {status: EFlag.Grey, title: 'Unknown', theme: 'unknown', critical: false},
    {status: EFlag.Green, title: 'Good', theme: 'success', critical: false},
    {status: EFlag.Blue, title: 'Replication', theme: 'info', critical: false},
    {status: EFlag.Yellow, title: 'Warning', theme: 'warning', critical: false},
    {status: EFlag.Orange, title: 'Caution', theme: 'danger', critical: false},
    {status: EFlag.Red, title: 'Critical', theme: 'danger', critical: true},
] as const;

function renderStatus(status: EFlag) {
    return render(
        <ThemeProvider theme="light">
            <EntityStatus.Label status={status} />
        </ThemeProvider>,
    );
}

describe('EntityStatus.Label', () => {
    test.each(statusCases)(
        'renders the approved $status label',
        ({status, title, theme, critical}) => {
            renderStatus(status);

            const label = screen.getByText(title).closest('.g-label');

            expect(label).toHaveClass(`g-label_theme_${theme}`);
            if (critical) {
                expect(label).toHaveClass('ydb-entity-status-new_critical');
            } else {
                expect(label).not.toHaveClass('ydb-entity-status-new_critical');
            }
        },
    );
});

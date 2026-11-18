import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {EFlag} from '../../../types/api/enums';
import {EntityStatus} from '../EntityStatus';

describe('EntityStatus.Label', () => {
    test.each([
        [EFlag.Red, 'Critical', 'danger'],
        [EFlag.Orange, 'Caution', 'danger'],
        [EFlag.Yellow, 'Warning', 'warning'],
        [EFlag.Blue, 'Normal', 'info'],
        [EFlag.Green, 'Good', 'success'],
        [EFlag.Grey, 'Unknown', 'unknown'],
    ] as const)('renders %s as an accessible compact status', async (status, name, theme) => {
        const {container} = render(<EntityStatus.Label status={status} view="compact" />, {
            wrapper: ThemeProvider,
        });
        const icon = screen.getByRole('img', {name});

        expect(icon).not.toHaveAttribute('tabindex');
        expect(screen.queryByText(name)).not.toBeInTheDocument();
        expect(container.querySelector('.g-label__text')).not.toBeInTheDocument();
        expect(container.querySelector(`.g-label_theme_${theme}`)).toBeInTheDocument();
        expect(container.querySelector('.ydb-entity-status_critical')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();

        fireEvent.mouseEnter(icon);
        expect(await screen.findByText(name)).toBeVisible();
    });

    test('preserves the default critical label, content and description', async () => {
        const {container} = render(
            <EntityStatus.Label status={EFlag.Red} endContent="extra">
                Cluster
            </EntityStatus.Label>,
            {wrapper: ThemeProvider},
        );

        expect(container).toHaveTextContent('ClusterCritical');
        expect(screen.getByText('extra')).toBeVisible();
        const label = container.getElementsByClassName('ydb-entity-status_critical')[0];
        expect(label).toBeInTheDocument();
        fireEvent.mouseEnter(label);
        expect(
            await screen.findByText('Critical state, requires immediate attention'),
        ).toBeVisible();
    });

    test('preserves existing icon-and-content labels and click handlers', () => {
        const onClick = jest.fn();
        const {container} = render(
            <EntityStatus.Label status={EFlag.Blue} withStatusName={false} onClick={onClick}>
                Replication
            </EntityStatus.Label>,
            {wrapper: ThemeProvider},
        );

        expect(container.querySelector('.g-label_theme_success')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', {name: 'Replication'}));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Normal')).not.toBeInTheDocument();
    });
});

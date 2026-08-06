import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import {configureUIFactory} from '../../../uiFactory/uiFactory';
import {StorageGroupInfo} from '../StorageGroupInfo';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useBlobStorageCapacityMetricsEnabled: () => true,
}));

const storageGroup = {AllocationUnits: 4} as PreparedStorageGroup;

function renderStorageGroupInfo() {
    return render(
        <ThemeProvider theme="light">
            <StorageGroupInfo data={storageGroup} />
        </ThemeProvider>,
    );
}

function getAllocationUnitsHelpMark() {
    const label = screen.getByText('Allocation Units', {exact: true});
    const labelContainer = label.closest('.info-viewer__label-text');

    expect(labelContainer).not.toBeNull();

    return within(labelContainer as HTMLElement).getByRole('button');
}

describe('StorageGroupInfo Allocation Units', () => {
    afterEach(() => {
        configureUIFactory({docs: undefined});
    });

    test('shows the channel explanation and configured documentation link', async () => {
        configureUIFactory({
            docs: {
                basePath: 'https://ydb.tech',
                distributedStorageChannel: '/docs/concepts/glossary#channel',
            },
        });
        const user = userEvent.setup();
        renderStorageGroupInfo();

        expect(screen.queryByText('Units', {exact: true})).not.toBeInTheDocument();

        await user.hover(getAllocationUnitsHelpMark());

        expect(
            await screen.findByText(
                'The number of channels used by tablets to write data to the storage group.',
            ),
        ).toBeVisible();
        expect(screen.getByRole('link', {name: /Learn more/})).toHaveAttribute(
            'href',
            'https://ydb.tech/docs/concepts/glossary#channel',
        );
    });

    test('keeps the channel explanation when documentation is not configured', async () => {
        configureUIFactory({docs: undefined});
        const user = userEvent.setup();
        renderStorageGroupInfo();

        await user.hover(getAllocationUnitsHelpMark());

        expect(
            await screen.findByText(
                'The number of channels used by tablets to write data to the storage group.',
            ),
        ).toBeVisible();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});

import * as NiceModal from '@ebay/nice-modal-react';
import {ThemeProvider} from '@gravity-ui/uikit';
import {act, screen} from '@testing-library/react';

import {configureStore} from '../../../../../../../store';
import {renderWithStore} from '../../../../../../../utils/tests/providers';
import {openManagePartitioningDialog} from '../ManagePartitioningDialog';
import {MANAGE_PARTITIONING_DIALOG} from '../constants';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
});

function renderDialog(getConfig: jest.Mock) {
    const storeConfiguration = configureStore({
        api: {viewer: {getConfig}} as never,
    });

    renderWithStore(
        <ThemeProvider theme="light">
            <NiceModal.Provider />
        </ThemeProvider>,
        {storeConfiguration},
    );

    act(() => {
        openManagePartitioningDialog({database: '/local'});
    });
}

describe('ManagePartitioningDialog', () => {
    afterEach(() => {
        act(() => {
            NiceModal.remove(MANAGE_PARTITIONING_DIALOG);
        });
    });

    test('does not show a Split Size maximum when config loading fails', async () => {
        renderDialog(jest.fn().mockRejectedValue({status: 403}));

        expect(await screen.findByLabelText('Split Size')).toBeVisible();
        expect(screen.queryByText(/GB\s+maximum/)).not.toBeInTheDocument();
    });

    test('shows a Split Size maximum when config loading succeeds', async () => {
        renderDialog(
            jest.fn().mockResolvedValue({
                ImmediateControlsConfig: {
                    SchemeShardControls: {ForceShardSplitDataSize: 4_000_000_000},
                },
                StartupConfigYaml: '',
            }),
        );

        expect(await screen.findByText(/4\s+GB\s+maximum/)).toBeVisible();
    });

    test('shows the default Split Size maximum when config has no value', async () => {
        renderDialog(jest.fn().mockResolvedValue({StartupConfigYaml: ''}));

        expect(await screen.findByText(/2\.1\s+GB\s+maximum/)).toBeVisible();
    });
});

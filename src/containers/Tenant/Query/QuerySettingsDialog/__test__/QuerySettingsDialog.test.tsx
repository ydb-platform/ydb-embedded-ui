import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    useSnapshotReadWriteAvailable,
    useTracingLevelOptionAvailable,
} from '../../../../../store/reducers/capabilities/hooks';
import type {QuerySettings} from '../../../../../types/store/query';
import {
    useQueryExecutionSettings,
    useQueryStreamingSetting,
    useResourcePools,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../../utils/hooks';
import {DEFAULT_QUERY_SETTINGS, TRANSACTION_MODES} from '../../../../../utils/query';
import {reachMetricaGoal} from '../../../../../utils/yaMetrica';
import {QuerySettingsDialog} from '../QuerySettingsDialog';

jest.mock('../../../../../utils/hooks');
jest.mock('../../../../../utils/yaMetrica', () => ({reachMetricaGoal: jest.fn()}));
jest.mock('../../../../../store/reducers/capabilities/hooks', () => ({
    useSnapshotReadWriteAvailable: jest.fn(() => true),
    useTracingLevelOptionAvailable: jest.fn(() => true),
}));
jest.mock('../../../TenantContext', () => ({useCurrentSchema: () => ({database: '/local'})}));

function setup(initialSettings: QuerySettings = DEFAULT_QUERY_SETTINGS) {
    const saved = jest.fn();
    function Harness() {
        const [settings, setSettings] = React.useState(initialSettings);
        const [open, setOpen] = React.useState(true);
        jest.mocked(useQueryExecutionSettings).mockReturnValue([
            settings,
            (next) => {
                saved(next);
                setSettings(next);
            },
        ]);
        jest.mocked(useTypedSelector).mockReturnValue(open ? 'settings' : 'idle');
        const dispatch = jest.fn();
        dispatch.mockImplementation(() => setOpen(false));
        jest.mocked(useTypedDispatch).mockReturnValue(dispatch);
        return (
            <ThemeProvider theme="light">
                <button onClick={() => setOpen(true)}>Open settings</button>
                <QuerySettingsDialog />
            </ThemeProvider>
        );
    }
    render(<Harness />);
    return {saved, user: userEvent.setup()};
}

beforeAll(() => {
    window.matchMedia = jest.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }));
    window.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSnapshotReadWriteAvailable).mockReturnValue(true);
    jest.mocked(useTracingLevelOptionAvailable).mockReturnValue(true);
    jest.mocked(useQueryStreamingSetting).mockReturnValue([true, jest.fn()]);
    jest.mocked(useResourcePools).mockReturnValue({
        resourcePools: ['default', 'olap'],
        normalizedResourcePool: DEFAULT_QUERY_SETTINGS.resourcePool,
        isLoading: false,
        isFetching: false,
    });
});

test('opens with Full statistics, collapsed advanced fields and Apply', () => {
    setup();
    expect(screen.getByRole('radio', {name: 'Full'})).toBeChecked();
    expect(screen.getByRole('button', {name: 'Apply'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Advanced settings'})).toHaveAttribute(
        'aria-expanded',
        'false',
    );
    expect(screen.queryByLabelText('Query prefix')).not.toBeVisible();
});

test('discards cancelled edits and preserves advanced values when collapsed', async () => {
    const {user, saved} = setup();
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    await user.clear(screen.getByLabelText('Query prefix'));
    await user.type(screen.getByLabelText('Query prefix'), 'PRAGMA Test = "private";');
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    expect(screen.getByLabelText('Query prefix')).toHaveValue('PRAGMA Test = "private";');
    await user.click(screen.getByRole('button', {name: 'Cancel'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', {name: 'Open settings'}));
    expect(screen.getByRole('button', {name: 'Advanced settings'})).toHaveAttribute(
        'aria-expanded',
        'false',
    );
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    expect(screen.getByLabelText('Query prefix')).toHaveValue(DEFAULT_QUERY_SETTINGS.pragmas);
    expect(saved).not.toHaveBeenCalled();
    expect(reachMetricaGoal).not.toHaveBeenCalled();
});

test('does not offer snapshot read-write for a new selection', async () => {
    const {user} = setup();
    await user.click(screen.getByRole('combobox', {name: 'Transaction mode'}));
    expect(screen.queryByRole('option', {name: /Snapshot Read-Write/})).not.toBeInTheDocument();
    expect(screen.queryByRole('option', {name: /Read committed/})).not.toBeInTheDocument();
    expect(screen.getByRole('option', {name: /Online Read-Only/})).toHaveTextContent('Deprecated');
});

test('preserves saved snapshot read-write until another mode is applied', async () => {
    const {user, saved} = setup({
        ...DEFAULT_QUERY_SETTINGS,
        transactionMode: TRANSACTION_MODES.snapshotrw,
    });
    expect(screen.getByRole('combobox', {name: 'Transaction mode'})).toHaveTextContent(
        'Snapshot Read-Write',
    );
    await user.clear(screen.getByLabelText('Limit rows'));
    await user.type(screen.getByLabelText('Limit rows'), '123');
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    expect(saved).toHaveBeenLastCalledWith(
        expect.objectContaining({transactionMode: TRANSACTION_MODES.snapshotrw, limitRows: 123}),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', {name: 'Open settings'}));
    await user.click(screen.getByRole('combobox', {name: 'Transaction mode'}));
    await user.click(screen.getByRole('option', {name: /Serializable/}));
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', {name: 'Open settings'}));
    await user.click(screen.getByRole('combobox', {name: 'Transaction mode'}));
    expect(screen.queryByRole('option', {name: /Snapshot Read-Write/})).not.toBeInTheDocument();
});

test('enables tracing at Top Level and omits legacy query type descriptions', async () => {
    const {user, saved} = setup();
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    expect(screen.getByRole('combobox', {name: 'Tracing level'})).toBeDisabled();
    await user.click(screen.getByRole('switch', {name: 'Tracing'}));
    expect(screen.getByRole('combobox', {name: 'Tracing level'})).toHaveTextContent('Top Level');
    await user.click(screen.getByRole('combobox', {name: 'Query type'}));
    const legacyOption = screen.getByRole('option', {name: 'Scan Legacy'});
    expect(within(legacyOption).getByText('Legacy')).toBeVisible();
    expect(legacyOption.querySelector('.ydb-query-settings-select__item-description')).toBeNull();
    await user.click(legacyOption);
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({tracingLevel: 'toplevel'}));
});

test('reveals invalid advanced fields and only records valid changed Apply without query text', async () => {
    const {user, saved} = setup();
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    await user.type(screen.getByLabelText('Output chunk max size'), '-1');
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    await waitFor(() =>
        expect(screen.getByRole('button', {name: 'Advanced settings'})).toHaveAttribute(
            'aria-expanded',
            'true',
        ),
    );
    expect(saved).not.toHaveBeenCalled();
    expect(reachMetricaGoal).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Output chunk max size'));
    await user.clear(screen.getByLabelText('Query prefix'));
    await user.type(screen.getByLabelText('Query prefix'), 'PRAGMA Test = "secret";');
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    expect(reachMetricaGoal).toHaveBeenCalledTimes(1);
    expect(reachMetricaGoal).toHaveBeenCalledWith(
        'applyQuerySettings',
        expect.objectContaining({pragmasChanged: true, queryPrefixPresent: true}),
    );
    expect(JSON.stringify(jest.mocked(reachMetricaGoal).mock.calls)).not.toContain('secret');
});

test.each(['Cancel', 'Close dialog', 'Escape'])(
    'keeps saved mode after a draft change dismissed via %s',
    async (closeAction) => {
        const {user, saved} = setup({
            ...DEFAULT_QUERY_SETTINGS,
            transactionMode: TRANSACTION_MODES.snapshotrw,
        });
        await user.click(screen.getByRole('combobox', {name: 'Transaction mode'}));
        await user.click(screen.getByRole('option', {name: /Serializable/}));
        if (closeAction === 'Escape') {
            await user.keyboard('{Escape}');
        } else {
            await user.click(screen.getByRole('button', {name: closeAction}));
        }
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await user.click(screen.getByRole('button', {name: 'Open settings'}));
        expect(screen.getByRole('combobox', {name: 'Transaction mode'})).toHaveTextContent(
            'Snapshot Read-Write',
        );
        expect(saved).not.toHaveBeenCalled();
        expect(reachMetricaGoal).not.toHaveBeenCalled();
    },
);

test('does not record Apply without changes and keeps explicitly saved None statistics', async () => {
    const {user} = setup({...DEFAULT_QUERY_SETTINGS, statisticsMode: 'none'});
    expect(screen.getByRole('radio', {name: 'None'})).toBeChecked();
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(reachMetricaGoal).not.toHaveBeenCalled();
});

test('hides unsupported tracing and keeps the snapshot capability fallback', async () => {
    jest.mocked(useTracingLevelOptionAvailable).mockReturnValue(false);
    jest.mocked(useSnapshotReadWriteAvailable).mockReturnValue(false);
    const {user, saved} = setup({
        ...DEFAULT_QUERY_SETTINGS,
        transactionMode: TRANSACTION_MODES.snapshotrw,
    });
    await user.click(screen.getByRole('button', {name: 'Advanced settings'}));
    expect(screen.queryByRole('switch', {name: 'Tracing'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Apply'}));
    expect(saved).toHaveBeenCalledWith(
        expect.objectContaining({transactionMode: TRANSACTION_MODES.implicit}),
    );
});

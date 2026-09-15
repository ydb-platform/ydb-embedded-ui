import {fireEvent, render, screen, waitFor} from '@testing-library/react';

import {EvictVDiskButton} from '../EvictVDiskButton';

let mockSecurePath = false;
let mockNewDiskApi = false;
let mockAllowed = true;
const mockLegacyEvict = jest.fn();
const mockEvict = jest.fn();

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useTabletDevUiSecurePath: () => mockSecurePath,
    useDiskPagesAvailable: () => mockNewDiskApi,
}));
jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: () => mockAllowed,
}));
jest.mock('../../ButtonWithConfirmDialog/ButtonWithConfirmDialog', () => ({
    ButtonWithConfirmDialog: ({
        onConfirmAction,
        buttonDisabled,
    }: {
        onConfirmAction: () => Promise<void>;
        buttonDisabled?: boolean;
    }) => (
        <button disabled={buttonDisabled} onClick={() => onConfirmAction()}>
            Evict
        </button>
    ),
}));

const vDiskId = {GroupID: 1, GroupGeneration: 2, Ring: 3, Domain: 4, VDisk: 5};
const originalApi = Object.getOwnPropertyDescriptor(window, 'api');

beforeEach(() => {
    mockSecurePath = false;
    mockNewDiskApi = false;
    mockAllowed = true;
    mockLegacyEvict.mockReset().mockResolvedValue({result: true});
    mockEvict.mockReset().mockResolvedValue({result: true});
    Object.defineProperty(window, 'api', {
        configurable: true,
        value: {tablets: {evictVDiskOld: mockLegacyEvict}, vdisk: {evictVDisk: mockEvict}},
    });
});

afterEach(() => {
    if (originalApi) {
        Object.defineProperty(window, 'api', originalApi);
    } else {
        Reflect.deleteProperty(window, 'api');
    }
});

test('updates the legacy callback when the capability changes with the same VDisk', async () => {
    const {rerender} = render(<EvictVDiskButton vDiskId={vDiskId} />);
    fireEvent.click(screen.getByRole('button', {name: 'Evict'}));
    await waitFor(() => expect(mockLegacyEvict).toHaveBeenCalledTimes(1));
    expect(mockLegacyEvict).toHaveBeenLastCalledWith(
        expect.objectContaining({groupId: 1, vDiskIdx: 5, useSecurePath: false}),
    );

    mockSecurePath = true;
    rerender(<EvictVDiskButton vDiskId={vDiskId} />);
    fireEvent.click(screen.getByRole('button', {name: 'Evict'}));
    await waitFor(() => expect(mockLegacyEvict).toHaveBeenCalledTimes(2));
    expect(mockLegacyEvict).toHaveBeenLastCalledWith(
        expect.objectContaining({groupId: 1, vDiskIdx: 5, useSecurePath: true}),
    );
    expect(mockEvict).not.toHaveBeenCalled();
});

test('keeps the new disk API parameters independent of the flag', async () => {
    mockNewDiskApi = true;
    mockSecurePath = true;
    render(<EvictVDiskButton vDiskId={vDiskId} />);
    fireEvent.click(screen.getByRole('button', {name: 'Evict'}));
    await waitFor(() => expect(mockEvict).toHaveBeenCalledTimes(1));
    expect(mockEvict).toHaveBeenCalledWith({
        groupId: 1,
        groupGeneration: 2,
        failRealmIdx: 3,
        failDomainIdx: 4,
        vDiskIdx: 5,
        force: undefined,
    });
    expect(mockLegacyEvict).not.toHaveBeenCalled();
});

test.each(['permission', 'donor'])('preserves the %s restriction', (restriction) => {
    mockAllowed = restriction !== 'permission';
    render(<EvictVDiskButton vDiskId={vDiskId} donorMode={restriction === 'donor'} />);
    const button = screen.getByRole('button', {name: 'Evict'});
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockEvict).not.toHaveBeenCalled();
    expect(mockLegacyEvict).not.toHaveBeenCalled();
});

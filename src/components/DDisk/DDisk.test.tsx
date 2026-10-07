import {render, screen} from '@testing-library/react';

import {TPDiskState} from '../../types/api/pdisk';

import {DDisk, DDiskInfo} from './DDisk';

jest.mock('../../utils/developerUI/developerUI', () => ({
    useHasDeveloperUi: () => true,
    createDeveloperUILinkWithNodeId: (nodeId: number) => `http://cluster/node/${nodeId}`,
}));

test('links to the selected DDisk and Persistent Buffer instead of a VDisk', () => {
    render(
        <DDiskInfo
            data={{
                StoragePoolName: 'pool-a',
                NodeId: 3,
                PDiskId: 1000,
                DDiskSlotId: 1010,
                DDiskPath: 'actors/ddisks/ddisk_p000001000_s000001010',
                PersistentBufferId: '[3:5893148750:1010]',
                DDiskOccupancy: 0.25,
                PersistentBufferOccupancy: 0.5,
            }}
        />,
    );
    expect(screen.getByRole('link', {name: 'Open DDisk'})).toHaveAttribute(
        'href',
        'http://cluster/node/3/actors/ddisks/ddisk_p000001000_s000001010',
    );
    const buffer = new URL(
        screen.getByRole('link', {name: '[3:5893148750:1010]'}).getAttribute('href')!,
    );
    expect(buffer.pathname).toBe('/node/3/actors/persistent_buffer');
    expect(buffer.searchParams.get('pb')).toBe('[3:5893148750:1010]');
    expect(buffer.searchParams.get('describeFreeSpace')).toBe('1');
    expect(buffer.searchParams.get('showTablets')).toBeNull();
    expect(buffer.searchParams.get('tabletOpen.[3:5893148750:1010]')).toBe('1');
    expect(screen.getByText('pool-a')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.queryByText(/VDisk/)).not.toBeInTheDocument();
});

test.each([false, true])('unavailable DDisks are red (compact=%s)', (compact) => {
    render(<DDisk data={{HasWhiteboardData: false}} compact={compact} />);
    expect(screen.getByRole('button')).toHaveClass('ydb-ddisk_failed', 'ydb-ddisk_unavailable');
    expect(screen.getByRole('button')).toHaveAttribute(
        'aria-description',
        'Current disk data is unavailable',
    );
});

test.each([TPDiskState.DeviceIoError, TPDiskState.Stopped, TPDiskState.OpenFileError])(
    'DDisks on faulty PDisks are red (%s)',
    (pDiskState) => {
        render(<DDisk data={{HasWhiteboardData: true}} pDiskState={pDiskState} compact />);
        expect(screen.getByRole('button')).toHaveClass('ydb-ddisk_failed');
    },
);

test('healthy DDisks keep their usual color', () => {
    render(<DDisk data={{HasWhiteboardData: true}} pDiskState={TPDiskState.Normal} compact />);
    expect(screen.getByRole('button')).not.toHaveClass('ydb-ddisk_failed');
});

test('missing samples do not appear as zero utilization', () => {
    render(<DDiskInfo data={{NodeId: 3, DDiskSlotId: 1010, HasWhiteboardData: false}} />);
    expect(screen.getByText('Current disk data is unavailable')).toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

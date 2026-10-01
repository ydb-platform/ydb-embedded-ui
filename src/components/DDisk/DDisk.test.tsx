import {render, screen} from '@testing-library/react';

import {DDiskInfo} from './DDisk';

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
        screen.getByRole('link', {name: 'Open Persistent Buffer'}).getAttribute('href')!,
    );
    expect(buffer.pathname).toBe('/node/3/actors/persistent_buffer');
    expect(buffer.searchParams.get('pb')).toBe('[3:5893148750:1010]');
    expect(buffer.searchParams.get('describeFreeSpace')).toBe('1');
    expect(buffer.searchParams.get('showTablets')).toBe('1');
    expect(screen.getByText('pool-a')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.queryByText(/VDisk/)).not.toBeInTheDocument();
});

test('missing samples do not appear as zero utilization', () => {
    render(<DDiskInfo data={{NodeId: 3, DDiskSlotId: 1010, HasWhiteboardData: false}} />);
    expect(screen.getByText('Current disk data is unavailable')).toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

import {MemoryRouter} from 'react-router-dom';

import {renderWithStore} from '../../../../utils/tests/providers';

import {TPDiskState} from '../../../../types/api/pdisk';

import {PDisk} from '../PDisk';

describe('PDisk state', () => {
    it('Should determine severity based on State if space severity is OK', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk nodeId={1} data={{State: TPDiskState.Normal}} />
                <PDisk nodeId={2} data={{State: TPDiskState.ChunkQuotaError}} />
            </MemoryRouter>,
        );

        const [normalDisk, erroredDisk] = getAllByRole('meter');

        expect(normalDisk.className).not.toBe(erroredDisk.className);
    });

    it('Should determine severity based on space utilization if state severity is OK', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk
                    nodeId={1}
                    data={{State: TPDiskState.Normal, AvailableSize: '100', TotalSize: '100'}}
                />
                <PDisk
                    nodeId={2}
                    data={{State: TPDiskState.Normal, AvailableSize: '14', TotalSize: '100'}}
                />
                <PDisk
                    nodeId={3}
                    data={{State: TPDiskState.Normal, AvailableSize: '4', TotalSize: '100'}}
                />
            </MemoryRouter>,
        );

        const [disk1, disk2, disk3] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_green\b/i);
        expect(disk2.className).toMatch(/_yellow\b/i);
        expect(disk3.className).toMatch(/_red\b/i);
    });

    it('Should determine severity based on max severity of state and space utilization ', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk
                    nodeId={1}
                    data={{
                        State: TPDiskState.ChunkQuotaError,
                        AvailableSize: '100',
                        TotalSize: '100',
                    }}
                />
                <PDisk
                    nodeId={2}
                    data={{State: TPDiskState.Normal, AvailableSize: '4', TotalSize: '100'}}
                />
            </MemoryRouter>,
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_red\b/i);
        expect(disk2.className).toMatch(/_red\b/i);
    });

    it('Should display as unavailabe when no State is provided', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk nodeId={1} />
                <PDisk nodeId={2} data={{State: TPDiskState.ChunkQuotaError}} />
            </MemoryRouter>,
        );

        const [disk1, disk2] = getAllByRole('meter');

        // unavailable disks display with the grey color
        expect(disk1.className).toMatch(/_grey\b/i);
        expect(disk2.className).not.toMatch(/_grey\b/i);
    });

    it('Should display as unavailabe when no State is provided event if space severity is not OK', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk nodeId={1} data={{AvailableSize: '14', TotalSize: '100'}} />
                <PDisk nodeId={2} data={{AvailableSize: '4', TotalSize: '100'}} />
            </MemoryRouter>,
        );

        const [disk1, disk2] = getAllByRole('meter');

        expect(disk1.className).toMatch(/_grey\b/i);
        expect(disk2.className).toMatch(/_grey\b/i);
    });
});

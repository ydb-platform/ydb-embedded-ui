import {MemoryRouter} from 'react-router-dom';

import {renderWithStore} from '../../../../utils/tests/providers';

import {TPDiskState} from '../../../../types/api/pdisk';

import {PDisk} from '../PDisk';

describe('PDisk state', () => {
    it('Should determine severity based on State', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk nodeId={1} data={{State: TPDiskState.Normal}} />
                <PDisk nodeId={2} data={{State: TPDiskState.ChunkQuotaError}} />
            </MemoryRouter>,
        );

        const [normalDisk, erroredDisk] = getAllByRole('meter');

        expect(normalDisk.className).not.toBe(erroredDisk.className);
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
});

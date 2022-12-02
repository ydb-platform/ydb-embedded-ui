import {MemoryRouter} from 'react-router-dom';

import {renderWithStore} from '../../../../utils/tests/providers';

import {TPDiskState} from '../../../../types/api/pdisk'

import PDisk from '../Pdisk'

describe('PDisk state', () => {
    it('Should determine severity based on State', () => {
        const {getAllByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk
                    NodeId={1}
                    State={TPDiskState.Normal}
                />
                <PDisk
                    NodeId={2}
                    State={TPDiskState.ChunkQuotaError}
                />
            </MemoryRouter>
        );

        const [normalDisk, erroredDisk] = getAllByRole('meter');

        expect(normalDisk.className).not.toBe(erroredDisk.className);
    });

    it('Should display as unavailabe when no State is provided', () => {
        const {getByRole} = renderWithStore(
            <MemoryRouter>
                <PDisk NodeId={1} />
            </MemoryRouter>
        );

        const disk = getByRole('meter');

        // unavailable disks display with the highest severity
        expect(disk.className).toMatch(/_red\b/i);
    });
});

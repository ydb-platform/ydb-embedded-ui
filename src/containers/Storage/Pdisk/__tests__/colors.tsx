import {render} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom';

import {TPDiskState} from '../../../../types/api/storage'

import PDisk from '../Pdisk'

describe('PDisk state', () => {
    it('Should determine severity based on State', () => {
        const {getAllByRole} = render(
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
        const {getByRole} = render(
            <MemoryRouter>
                <PDisk NodeId={1} />
            </MemoryRouter>
        );

        const disk = getByRole('meter');

        // unavailable disks display with the highest severity
        expect(disk.className).toMatch(/_red\b/i);
    });
});

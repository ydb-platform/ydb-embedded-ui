import React from 'react';

import {render, screen, within} from '@testing-library/react';

import type {PreparedCluster} from '../../../store/reducers/clusters/types';
import {EFlag} from '../../../types/api/enums';
import type {MetaViewerClusterInfo} from '../../../types/api/meta';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {getClustersColumns} from '../columns';
import {COLUMNS_NAMES} from '../constants';

const metricColumns = getClustersColumns({}).filter((column) =>
    [COLUMNS_NAMES.NODES, COLUMNS_NAMES.LOAD, COLUMNS_NAMES.STORAGE].some(
        (name) => column.name === name,
    ),
);

test.each<{
    name: string;
    measurements: Partial<MetaViewerClusterInfo>;
    expected: (string | undefined)[];
}>([
    {
        name: 'absent measurements',
        measurements: {},
        expected: [],
    },
    {
        name: 'explicit zeros including zero capacities',
        measurements: {
            NodesAlive: 0,
            NodesTotal: 0,
            LoadAverage: 0,
            NumberOfCpus: 0,
            StorageUsed: '0',
            StorageTotal: '0',
        },
        expected: ['0 of 0', '0 of 0', '0 of 0 TB'],
    },
    {
        name: 'retained measurements with preferred real CPU capacity',
        measurements: {
            NodesAlive: 3,
            NodesTotal: 4,
            LoadAverage: 2,
            NumberOfCpus: 4,
            RealNumberOfCpus: 8,
            StorageUsed: '1099511627776',
            StorageTotal: '2199023255552',
        },
        expected: ['3 of 4', '2 of 8', '1 of 2 TB'],
    },
    {
        name: 'only real CPU capacity with omitted default-zero load',
        measurements: {RealNumberOfCpus: 4},
        expected: [undefined, '0 of 4', undefined],
    },
])('Unknown health preserves metric availability: $name', ({measurements, expected}) => {
    expect(metricColumns).toHaveLength(3);
    const row = {
        name: 'unavailable',
        cluster: {Overall: EFlag.Grey, ...measurements},
    } as PreparedCluster;
    render(
        <React.Fragment>
            {metricColumns.map((column) => (
                <div key={column.name} data-testid={column.name}>
                    {column.render?.({row, index: 0})}
                </div>
            ))}
        </React.Fragment>,
    );

    for (const [index, column] of metricColumns.entries()) {
        const cell = screen.getByTestId(column.name);
        const reading = expected[index];
        if (reading) {
            expect(within(cell).queryByText(EMPTY_DATA_PLACEHOLDER)).not.toBeInTheDocument();
            expect(within(cell).getByText(reading)).toBeInTheDocument();
        } else {
            expect(within(cell).getByText(EMPTY_DATA_PLACEHOLDER)).toHaveClass(
                'ydb-clusters__empty-cell',
            );
            expect(cell.querySelector('.g-progress')).not.toBeInTheDocument();
        }
    }
});

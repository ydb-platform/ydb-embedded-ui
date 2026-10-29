import React from 'react';

import {render, screen, within} from '@testing-library/react';

import type {PreparedCluster} from '../../../store/reducers/clusters/types';
import {EFlag} from '../../../types/api/enums';
import type {MetaViewerClusterInfo} from '../../../types/api/meta';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {getEffectiveHealth, prepareHealthStatus} from '../../../utils/healthStatus/healthStatus';
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
    expected: ([string, number] | undefined)[];
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
        expected: [
            ['0 of 0', 0],
            ['0 of 0', 0],
            ['0 of 0 TB', 0],
        ],
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
        expected: [
            ['3 of 4', 75],
            ['2 of 8', 25],
            ['1 of 2 TB', 50],
        ],
    },
    {
        name: 'only real CPU capacity with omitted default-zero load',
        measurements: {RealNumberOfCpus: 4},
        expected: [undefined, ['0 of 4', 0], undefined],
    },
])('Unknown health preserves metric availability: $name', ({measurements, expected}) => {
    expect(metricColumns).toHaveLength(3);
    const cluster = getEffectiveHealth(
        prepareHealthStatus({error: '400 Bad Request', status_ttl_ms: 0, ...measurements}, 1000),
        1000,
    );
    expect(cluster.Overall).toBe(EFlag.Grey);
    const row = {name: 'unavailable', cluster} as PreparedCluster;
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
            expect(within(cell).getByText(reading[0])).toBeInTheDocument();
            expect(cell.querySelector('.g-progress__item')).toHaveStyle({
                transform: `translateX(calc(var(--g-flow-direction) * ${reading[1] - 100}%))`,
            });
        } else {
            expect(within(cell).getByText(EMPTY_DATA_PLACEHOLDER)).toHaveClass(
                'ydb-clusters__empty-cell',
            );
            expect(cell.querySelector('.g-progress')).not.toBeInTheDocument();
        }
    }
});

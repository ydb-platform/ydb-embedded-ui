import React from 'react';

import {render, screen} from '@testing-library/react';

import type {TPartitionConfig} from '../../../../../../../types/api/schema';
import {prepareRowTableGeneralInfo} from '../prepareRowTableInfo';
import type {PartitionProgressConfig} from '../renderHelpers';

const PROGRESS: PartitionProgressConfig = {
    minPartitions: 1,
    maxPartitions: undefined,
    partitionsCount: 1,
};

function renderPartitioningBySize(partitionConfig: TPartitionConfig) {
    const {left} = prepareRowTableGeneralInfo(partitionConfig, PROGRESS);
    const field = left.find((item) => item.name === 'Partitioning by size');

    render(<React.Fragment>{field?.content}</React.Fragment>);
}

describe('prepareRowTableGeneralInfo', () => {
    test('shows Disabled for partitioning by size when SizeToSplit is not set', () => {
        renderPartitioningBySize({PartitioningPolicy: {}});

        expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    test('shows Disabled for partitioning by size when SizeToSplit is "0"', () => {
        renderPartitioningBySize({PartitioningPolicy: {SizeToSplit: '0'}});

        expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    test('shows the split size when partitioning by size is enabled', () => {
        renderPartitioningBySize({PartitioningPolicy: {SizeToSplit: '2147483648'}});

        expect(screen.getByText('Enabled, split size: 2 GB')).toBeInTheDocument();
    });
});

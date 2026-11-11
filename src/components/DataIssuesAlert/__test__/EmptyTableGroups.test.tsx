import {render, screen} from '@testing-library/react';

import {EmptyTableGroups} from '../EmptyTableGroups';

describe('EmptyTableGroups', () => {
    test('Should say there are no groups when nothing is wrong', () => {
        render(<EmptyTableGroups issues={[]} rowsMayBeMissing={false} emptyMessage="No groups" />);

        expect(screen.getByText('No groups')).toBeInTheDocument();
    });

    test('Should not claim there are no groups when rows may be missing', () => {
        render(
            <EmptyTableGroups
                issues={['list-incomplete']}
                problems={['bsc-timeout']}
                rowsMayBeMissing
                emptyMessage="No groups"
            />,
        );

        expect(
            screen.getByText('Nothing to show, but the data may be incomplete'),
        ).toBeInTheDocument();
        expect(screen.queryByText('No groups')).not.toBeInTheDocument();
    });

    test('Should explain that grouping was not applied instead of an empty message', () => {
        render(
            <EmptyTableGroups
                issues={['group-not-applied', 'partial-data']}
                problems={['hive-timeout']}
                rowsMayBeMissing
                emptyMessage="No groups"
            />,
        );

        expect(screen.getByText('Grouping was not applied.')).toBeInTheDocument();
        expect(
            screen.getByText('Problems reported by the server: hive-timeout'),
        ).toBeInTheDocument();
        expect(screen.queryByText('No groups')).not.toBeInTheDocument();
        expect(
            screen.queryByText('Nothing to show, but the data may be incomplete'),
        ).not.toBeInTheDocument();
    });
});

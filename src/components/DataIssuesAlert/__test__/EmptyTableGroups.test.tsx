import {render, screen} from '@testing-library/react';

import {DATA_ISSUES_ALERT_QA, getEmptyDataWithIssuesMessage} from '../DataIssuesAlert';
import {EmptyTableGroups} from '../EmptyTableGroups';

const EMPTY_MESSAGE = 'No groups';

function getAlert() {
    return document.querySelector(`[data-qa="${DATA_ISSUES_ALERT_QA}"]`);
}

describe('EmptyTableGroups', () => {
    test('Should say there are no groups when nothing is wrong', () => {
        render(
            <EmptyTableGroups issues={[]} rowsMayBeMissing={false} emptyMessage={EMPTY_MESSAGE} />,
        );

        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
    });

    test('Should not claim there are no groups when rows may be missing', () => {
        render(
            <EmptyTableGroups
                issues={['list-incomplete']}
                problems={['bsc-timeout']}
                rowsMayBeMissing
                emptyMessage={EMPTY_MESSAGE}
            />,
        );

        expect(screen.getByText(getEmptyDataWithIssuesMessage())).toBeInTheDocument();
        expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
    });

    test('Should show the issues instead of any empty message when grouping was not applied', () => {
        render(
            <EmptyTableGroups
                issues={['group-not-applied', 'partial-data']}
                problems={['hive-timeout']}
                rowsMayBeMissing
                emptyMessage={EMPTY_MESSAGE}
            />,
        );

        expect(getAlert()).toBeInTheDocument();
        expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
        expect(screen.queryByText(getEmptyDataWithIssuesMessage())).not.toBeInTheDocument();
    });
});

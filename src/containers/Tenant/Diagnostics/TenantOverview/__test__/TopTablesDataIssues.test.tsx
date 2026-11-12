import {render, screen} from '@testing-library/react';

import type {ResponseDataQuality} from '../../../../../utils/dataIssues/types';
import {TopGroupsDataIssues, TopNodesDataIssues} from '../TopTablesDataIssues';

function quality(extra: Partial<ResponseDataQuality> = {}): ResponseDataQuality {
    return {problems: [], needFilter: false, needSort: false, needGroup: false, ...extra};
}

describe('TopNodesDataIssues', () => {
    test('renders nothing until the response is loaded or when it is clean', () => {
        const {container, rerender} = render(<TopNodesDataIssues tableTitle="Top nodes by load" />);
        expect(container).toBeEmptyDOMElement();

        rerender(<TopNodesDataIssues tableTitle="Top nodes by load" dataQuality={quality()} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('names the table it warns about, so several tops of a page are told apart', () => {
        render(
            <div>
                <TopNodesDataIssues
                    tableTitle="Top nodes by load"
                    dataQuality={quality({problems: ['hive-timeout']})}
                />
                <TopNodesDataIssues
                    tableTitle="Top nodes by pools usage"
                    dataQuality={quality({needSort: true})}
                />
            </div>,
        );

        expect(screen.getByRole('button', {name: /Top nodes by load$/})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Top nodes by pools usage$/})).toBeInTheDocument();
    });
});

describe('TopGroupsDataIssues', () => {
    test('shows the indicator for the problems of storage groups', () => {
        render(
            <TopGroupsDataIssues
                tableTitle="Top groups by usage"
                dataQuality={quality({problems: ['bsc-timeout']})}
            />,
        );

        expect(screen.getByRole('button', {name: /Top groups by usage$/})).toBeInTheDocument();
    });
});

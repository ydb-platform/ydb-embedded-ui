import {render, screen} from '@testing-library/react';

import type {ExtendedTBlock} from '../../types';
import {StageBlockComponent} from '../StageBlockComponent';

const stageBlock: ExtendedTBlock = {
    id: 'stage-1',
    is: 'stage',
    x: 0,
    y: 0,
    width: 248,
    height: 34,
    name: 'Empty operators stage',
    operators: [],
};

describe('StageBlockComponent', () => {
    test('renders the stage name when operators is an empty array', () => {
        render(<StageBlockComponent className="stage" block={stageBlock} />);

        expect(screen.getByText('Empty operators stage')).toBeVisible();
    });

    test('renders each table in its own row', () => {
        const {container} = render(
            <StageBlockComponent
                className="stage"
                block={{...stageBlock, tables: ['/Root/First', '/Root/Second']}}
            />,
        );

        const tableRows = container.querySelectorAll('.ydb-gravity-graph__stage-table-row');

        expect(tableRows).toHaveLength(2);
        expect(tableRows[0]).toHaveTextContent('Tables: /Root/First');
        expect(tableRows[0]).toHaveAttribute('title', '/Root/First');
        expect(tableRows[1]).toHaveTextContent('/Root/Second');
        expect(tableRows[1]).toHaveAttribute('title', '/Root/Second');
    });
});

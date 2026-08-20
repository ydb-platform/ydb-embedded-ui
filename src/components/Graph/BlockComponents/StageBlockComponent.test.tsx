import {render, screen} from '@testing-library/react';

import type {ExtendedTBlock} from '../types';

import {StageBlockComponent} from './StageBlockComponent';

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
});

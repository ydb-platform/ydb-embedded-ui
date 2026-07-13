import {render, screen} from '@testing-library/react';

import {QueryEditorControls} from '../QueryEditorControls';

jest.mock('../../../../../store/reducers/cancelQuery', () => ({
    cancelQueryApi: {
        useCancelQueryMutation: jest.fn(),
    },
}));

jest.mock('../../../../../utils/hooks', () => ({
    useTypedSelector: jest.fn(),
}));

jest.mock('../../NewSQL/NewSQL', () => ({
    NewSQL: () => null,
}));

jest.mock('../../SaveQuery/SaveQuery', () => ({
    SaveQuery: () => null,
}));

jest.mock('../EditorButton', () => ({
    EditorButton: {
        Run: ({view}: {view?: string}) => <button data-view={view}>Run</button>,
        Stop: ({view}: {view?: string}) => <button data-view={view}>Stop</button>,
        Explain: ({view}: {view?: string}) => <button data-view={view}>Explain</button>,
        Settings: () => null,
    },
}));

const {cancelQueryApi} = jest.requireMock('../../../../../store/reducers/cancelQuery');
const {useTypedSelector} = jest.requireMock('../../../../../utils/hooks');

const defaultProps = {
    isLoading: false,
    isStoppable: true,
    highlightedAction: 'execute' as const,
    database: '/Root',
    handleGetExplainQueryClick: jest.fn(),
    handleSendExecuteClick: jest.fn(),
    onSettingsButtonClick: jest.fn(),
};

describe('QueryEditorControls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cancelQueryApi.useCancelQueryMutation.mockReturnValue([jest.fn(), {isLoading: false}]);
        useTypedSelector.mockReturnValue('SELECT 1');
    });

    test('keeps Run highlighted before execution', () => {
        render(<QueryEditorControls {...defaultProps} />);

        expect(screen.getByRole('button', {name: 'Run'})).toHaveAttribute('data-view', 'action');
    });

    test('renders Stop without the Run action view during execution', () => {
        render(<QueryEditorControls {...defaultProps} isLoading />);

        expect(screen.getByRole('button', {name: 'Stop'})).not.toHaveAttribute('data-view');
    });
});

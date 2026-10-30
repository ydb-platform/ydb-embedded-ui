import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {createAndDownloadJsonFile} from '../../../../../utils/downloadFile';
import {DiagnosticsButton} from '../components/DiagnosticsButton/DiagnosticsButton';
import {MetricsCell} from '../components/SimplifiedPlan/MetricsCell';

jest.mock('../../../../../utils/downloadFile', () => ({createAndDownloadJsonFile: jest.fn()}));

test('downloads the unchanged diagnostics fields including parsed errors', () => {
    const props = {
        queryText: 'SELECT 1;',
        database: '/local',
        ast: 'ast',
        stats: {DurationUs: '1'},
        plan: {meta: {type: 'query' as const, version: '0.2'}},
        error: 'failure',
    };
    render(
        <ThemeProvider theme="light">
            <DiagnosticsButton {...props} />
        </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Diagnostics .JSON'}));
    expect(createAndDownloadJsonFile).toHaveBeenCalledWith(
        props,
        expect.stringMatching(/^query-diagnostics-\d+$/),
    );
});

test.each([undefined, null, ''])('does not fabricate zero for missing metrics %s', (value) => {
    const {container} = render(<MetricsCell value={value} formatter={String} />);
    expect(container).toBeEmptyDOMElement();
});
test('shows a real zero metric', () => {
    render(<MetricsCell value={0} formatter={String} />);
    expect(screen.getByText('0')).toBeVisible();
});

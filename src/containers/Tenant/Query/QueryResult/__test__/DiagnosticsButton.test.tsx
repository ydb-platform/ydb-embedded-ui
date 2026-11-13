import {fireEvent, render, screen} from '@testing-library/react';

import {createAndDownloadJsonFile} from '../../../../../utils/downloadFile';
import {DiagnosticsButton} from '../components/DiagnosticsButton/DiagnosticsButton';

jest.mock('../../../../../utils/downloadFile', () => ({
    createAndDownloadJsonFile: jest.fn(),
}));

test('passes only diagnostic fields to the JSON downloader', () => {
    const data = {
        database: '/local',
        queryText: 'SELECT 1;',
        ast: '(return 1)',
        stats: {DurationUs: '100'},
        plan: {meta: {type: 'query' as const, version: '0.2'}},
    };
    const props = {...data, className: 'toolbar', qa: 'diagnostics'};
    render(<DiagnosticsButton {...props} />);

    fireEvent.click(screen.getByRole('button', {name: 'Diagnostics .JSON'}));

    expect(createAndDownloadJsonFile).toHaveBeenCalledWith(
        data,
        expect.stringMatching(/^query-diagnostics-\d+$/),
    );
});

import {ThemeProvider} from '@gravity-ui/uikit';
import {render} from '@testing-library/react';

import {QueryJSONViewer} from '../components/QueryJSONViewer/QueryJSONViewer';

jest.mock('../../../../../utils/hooks', () => ({useTypedSelector: () => false}));
jest.mock('../../../../../components/JsonViewer/JsonViewer', () => ({JsonViewer: () => null}));

test.each([
    ['light', true],
    ['dark', true],
    ['light-hc', false],
    ['dark-hc', false],
] as const)(
    'applies the Figma palette in %s without changing high-contrast themes',
    (theme, expected) => {
        const {container} = render(
            <ThemeProvider theme={theme}>
                <QueryJSONViewer data={{value: 1}} />
            </ThemeProvider>,
        );
        expect(
            container.firstElementChild?.classList.contains('ydb-query-json-viewer_default-theme'),
        ).toBe(expected);
    },
);

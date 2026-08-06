import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import {TitleWithHelpMark} from '../TitleWithHelpmark';

describe('TitleWithHelpMark', () => {
    test('uses the localized header as the help button accessible name', () => {
        const header = 'Group Size In Units';

        render(
            <ThemeProvider theme="light">
                <TitleWithHelpMark header={header} note="Capacity units help" />
            </ThemeProvider>,
        );

        expect(screen.getByRole('button', {name: header})).toBeVisible();
    });
});

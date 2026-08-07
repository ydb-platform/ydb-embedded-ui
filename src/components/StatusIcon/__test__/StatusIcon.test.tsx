import {
    ArrowsRotateRight,
    CircleCheck,
    CircleXmark,
    Flame,
    Ghost,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';
import {render} from '@testing-library/react';
import {compile} from 'sass';

import {EFlag} from '../../../types/api/enums';
import {StatusIcon} from '../StatusIcon';

const iconCases: Array<{status: EFlag; icon: IconData}> = [
    {status: EFlag.Grey, icon: Ghost},
    {status: EFlag.Green, icon: CircleCheck},
    {status: EFlag.Blue, icon: ArrowsRotateRight},
    {status: EFlag.Yellow, icon: TriangleExclamation},
    {status: EFlag.Orange, icon: Flame},
    {status: EFlag.Red, icon: CircleXmark},
];

describe('StatusIcon', () => {
    test.each(iconCases)('uses the approved icon for $status', ({status, icon}) => {
        const {container: actualContainer} = render(<StatusIcon mode="icons" status={status} />);
        const {container: expectedContainer} = render(<Icon data={icon} />);

        expect(actualContainer.querySelector('svg')?.innerHTML).toBe(
            expectedContainer.querySelector('svg')?.innerHTML,
        );
    });

    test('uses the healthy color for blue status in both modes', () => {
        const css = compile('src/components/StatusIcon/StatusIcon.scss').css;

        expect(css).toContain(
            '.ydb-status-icon__status-color_state_blue {\n  background-color: var(--ydb-color-status-green);\n}',
        );
        expect(css).toContain(
            '.ydb-status-icon__status-icon_state_blue {\n  color: var(--ydb-color-status-green);\n}',
        );
    });
});

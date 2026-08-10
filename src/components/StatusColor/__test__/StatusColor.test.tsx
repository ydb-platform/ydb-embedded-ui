import {render} from '@testing-library/react';

import {EFlag} from '../../../types/api/enums';
import {StatusColor} from '../StatusColor';

describe('StatusColor', () => {
    test('uses its own BEM block', () => {
        const {container} = render(<StatusColor status={EFlag.Green} />);

        expect(container.firstElementChild).toHaveClass(
            'ydb-status-color',
            'ydb-status-color_state_green',
            'ydb-status-color_size_s',
        );
        expect(container.firstElementChild).not.toHaveClass('ydb-status-icon__status-color');
    });
});

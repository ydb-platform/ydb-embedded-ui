import {render, screen} from '@testing-library/react';

import {Stack} from '../Stack';

describe('Stack', () => {
    test('derives total items count from valid children', () => {
        const {container} = render(
            <Stack>
                <div>main</div>
                text child
                <div>donor-1</div>
                {null}
                {false}
                <div>donor-2</div>
            </Stack>,
        );

        const stack = container.querySelector('.ydb-stack');

        expect(stack).toHaveStyle({'--ydb-stack-items-count': '3'});
    });

    test('passes item index and semantic modifiers to each valid child wrapper', () => {
        const {container} = render(
            <Stack>
                text child
                <div>main</div>
                {null}
                <div>donor-1</div>
                {false}
                <div>donor-2</div>
            </Stack>,
        );

        const items = container.querySelectorAll('.ydb-stack__item');

        expect(items).toHaveLength(3);
        expect(items[0]).toHaveStyle({'--ydb-stack-level': '0'});
        expect(items[0]).toHaveClass('ydb-stack__item_main');
        expect(items[0]).not.toHaveClass('ydb-stack__item_donor');

        expect(items[1]).toHaveStyle({'--ydb-stack-level': '1'});
        expect(items[1]).toHaveClass('ydb-stack__item_donor', 'ydb-stack__item_collapsed-hidden');
        expect(items[2]).toHaveStyle({'--ydb-stack-level': '2'});
        expect(items[2]).toHaveClass('ydb-stack__item_donor');
        expect(items[2]).not.toHaveClass('ydb-stack__item_collapsed-hidden');
    });

    test('does not render item wrappers for non-element children', () => {
        const {container} = render(
            <Stack>
                text child
                <div>main</div>
                {null}
                {false}
            </Stack>,
        );

        expect(container.querySelectorAll('.ydb-stack__item')).toHaveLength(1);
        expect(container.querySelector('.ydb-stack')).toHaveStyle({'--ydb-stack-items-count': '1'});
        expect(container.querySelector('.ydb-stack__item')).toHaveStyle({'--ydb-stack-level': '0'});
        expect(screen.getByText('main')).toBeVisible();
        expect(screen.queryByText('text child')).not.toBeInTheDocument();
    });

    test('applies compact modifier when compact prop is enabled', () => {
        const {container} = render(
            <Stack compact>
                <div>main</div>
            </Stack>,
        );

        expect(container.querySelector('.ydb-stack')).toHaveClass('ydb-stack_compact');
    });

    test('applies expanded modifier when expanded prop is enabled', () => {
        const {container} = render(
            <Stack expanded>
                <div>main</div>
            </Stack>,
        );

        expect(container.querySelector('.ydb-stack')).toHaveClass('ydb-stack_expanded');
    });
});

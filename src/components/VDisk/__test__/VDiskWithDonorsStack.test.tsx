import {fireEvent, render, screen} from '@testing-library/react';

import type {VDiskProps} from '../VDisk';
import {VDiskWithDonorsStack} from '../VDiskWithDonorsStack';

jest.mock('../VDisk', () => ({
    VDisk: ({
        data,
        compact,
        placement,
        popupOffset,
        showPopup,
        highlighted,
        withOpaqueBackground,
        onShowPopup,
        onHidePopup,
    }: VDiskProps) => (
        <button
            data-testid="mock-vdisk"
            data-compact={compact ? 'true' : 'false'}
            data-popup-offset={JSON.stringify(popupOffset)}
            data-placement={Array.isArray(placement) ? placement.join(',') : ''}
            data-show-popup={showPopup ? 'true' : 'false'}
            data-highlighted={highlighted ? 'true' : 'false'}
            data-with-opaque-background={withOpaqueBackground ? 'true' : 'false'}
            onMouseEnter={onShowPopup}
            onMouseLeave={onHidePopup}
            type="button"
        >
            {data?.StringifiedId}
        </button>
    ),
}));

describe('VDiskWithDonorsStack', () => {
    test('renders a single vdisk without donor stack when donors are absent', () => {
        const {container} = render(
            <VDiskWithDonorsStack data={{StringifiedId: 'main', NodeId: 1}} />,
        );

        expect(container.querySelector('.ydb-stack')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('mock-vdisk')).toHaveLength(1);
        expect(screen.getByText('main')).toBeVisible();
        expect(screen.getByTestId('mock-vdisk')).toHaveAttribute(
            'data-with-opaque-background',
            'false',
        );
    });

    test('renders stack with main vdisk and one donor', () => {
        const {container} = render(
            <VDiskWithDonorsStack
                data={{
                    StringifiedId: 'main',
                    NodeId: 1,
                    Donors: [{StringifiedId: 'donor-1', NodeId: 2}],
                }}
            />,
        );

        const stack = container.querySelector('.ydb-stack');

        expect(stack).toBeInTheDocument();
        expect(stack).toHaveStyle({'--ydb-stack-items-count': '2'});
        expect(screen.getAllByTestId('mock-vdisk')).toHaveLength(2);
        expect(screen.getByText('main')).toBeVisible();
        expect(screen.getByText('donor-1')).toBeVisible();
        screen.getAllByTestId('mock-vdisk').forEach((vDisk) => {
            expect(vDisk).toHaveAttribute('data-with-opaque-background', 'true');
        });
    });

    test('renders several donors in the original order', () => {
        const {container} = render(
            <VDiskWithDonorsStack
                data={{
                    StringifiedId: 'main',
                    NodeId: 1,
                    Donors: [
                        {StringifiedId: 'donor-1', NodeId: 2},
                        {StringifiedId: 'donor-2', NodeId: 3},
                        {StringifiedId: 'donor-3', NodeId: 4},
                    ],
                }}
            />,
        );

        const stack = container.querySelector('.ydb-stack');
        const vdiskIds = screen.getAllByTestId('mock-vdisk').map((node) => node.textContent);

        expect(stack).toHaveStyle({'--ydb-stack-items-count': '4'});
        expect(vdiskIds).toEqual(['main', 'donor-1', 'donor-2', 'donor-3']);
    });

    test('passes compact state to specialized stack', () => {
        const {container} = render(
            <VDiskWithDonorsStack
                compact
                data={{
                    StringifiedId: 'main',
                    NodeId: 1,
                    Donors: [{StringifiedId: 'donor-1', NodeId: 2}],
                }}
            />,
        );

        expect(container.querySelector('.ydb-stack')).toHaveClass('ydb-stack_compact');
    });

    test('passes increased popup offset to vdisks inside donor stack', () => {
        render(
            <VDiskWithDonorsStack
                data={{
                    StringifiedId: 'main',
                    NodeId: 1,
                    Donors: [{StringifiedId: 'donor-1', NodeId: 2}],
                }}
            />,
        );

        const [main, donor] = screen.getAllByTestId('mock-vdisk');

        expect(main).not.toHaveAttribute('data-popup-offset');
        expect(donor).toHaveAttribute('data-popup-offset', '{"mainAxis":7,"crossAxis":0}');

        fireEvent.mouseEnter(main);

        expect(main).toHaveAttribute('data-popup-offset', '{"mainAxis":7,"crossAxis":0}');
    });

    test('does not expand stack when highlighted vdisk comes from props', () => {
        const {container} = render(
            <VDiskWithDonorsStack
                highlightedVDisk="main"
                data={{
                    StringifiedId: 'main',
                    NodeId: 1,
                    Donors: [
                        {StringifiedId: 'donor-1', NodeId: 2},
                        {StringifiedId: 'donor-2', NodeId: 3},
                    ],
                }}
            />,
        );

        const stack = container.querySelector('.ydb-stack');
        const [main, donor1, donor2] = screen.getAllByTestId('mock-vdisk');

        expect(stack).not.toHaveClass('ydb-stack_expanded');
        expect(main).toHaveAttribute('data-highlighted', 'true');
        expect(main).toHaveAttribute('data-show-popup', 'true');
        expect(donor1).toHaveAttribute('data-highlighted', 'false');
        expect(donor1).toHaveAttribute('data-show-popup', 'false');
        expect(donor2).toHaveAttribute('data-highlighted', 'false');
        expect(donor2).toHaveAttribute('data-show-popup', 'false');
    });

    test('expands stack and highlights active donor using internal state without syncing props', () => {
        const setHighlightedVDisk = jest.fn();

        const {container} = render(
            <VDiskWithDonorsStack
                setHighlightedVDisk={setHighlightedVDisk}
                data={{
                    StringifiedId: 'main',
                    NodeId: 1,
                    Donors: [
                        {StringifiedId: 'donor-1', NodeId: 2},
                        {StringifiedId: 'donor-2', NodeId: 3},
                    ],
                }}
            />,
        );

        const stack = container.querySelector('.ydb-stack');
        const [main, donor1, donor2] = screen.getAllByTestId('mock-vdisk');

        fireEvent.mouseEnter(donor2);

        expect(setHighlightedVDisk).not.toHaveBeenCalled();
        expect(stack).toHaveClass('ydb-stack_expanded');
        expect(main).toHaveAttribute('data-highlighted', 'false');
        expect(main).toHaveAttribute('data-show-popup', 'false');
        expect(donor1).toHaveAttribute('data-highlighted', 'false');
        expect(donor1).toHaveAttribute('data-show-popup', 'false');
        expect(donor2).toHaveAttribute('data-highlighted', 'true');
        expect(donor2).toHaveAttribute('data-show-popup', 'false');
    });
});

import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';

import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {PDisk} from '../PDisk';

import {PDisksPreview} from './PDisksPreview';

let mockInverted = false;
const mockDetailsById = new Map<string, React.ComponentProps<typeof PDisk>>();
let mockDetailsProps: React.ComponentProps<typeof PDisk>;

jest.mock('../../../utils/hooks/useSetting', () => ({useSetting: () => [mockInverted]}));
jest.mock('../../../store', () => ({singleClusterMode: true}));
jest.mock('../PDisk', () => ({
    PDisk: (props: React.ComponentProps<typeof PDisk>) => {
        mockDetailsProps = props;
        mockDetailsById.set(props.data?.StringifiedId || '', props);
        return <button>Expanded PDisk</button>;
    },
}));

const pDisk: PreparedPDisk = {NodeId: 1, PDiskId: 1, StringifiedId: '1-1', AllocatedPercent: 25};
const vDisks: PreparedVDisk[] = Array.from({length: 12}, (_, index) => ({
    NodeId: 1,
    PDiskId: 1,
    VDiskSlotId: index,
    Severity: 1,
}));

beforeEach(() => {
    mockInverted = false;
});

test('groups identical VDisks and updates the preview on data refresh', () => {
    const {container, rerender} = render(<PDisksPreview pDisks={[pDisk]} vDisks={vDisks} />);
    const svg = container.querySelector('svg');
    if (!svg) {
        throw new Error('Missing PDisk preview SVG');
    }
    expect(screen.getByRole('button', {name: 'Show PDisk 1-1 details'})).toBeVisible();
    expect(svg.querySelectorAll('*')).toHaveLength(5);
    expect(svg.querySelector('path')?.getAttribute('d')?.match(/M/g)).toHaveLength(12);
    expect(svg.querySelector('.ydb-storage-pdisks-preview__pdisk-fill')).toHaveAttribute(
        'height',
        '10.25',
    );

    rerender(
        <PDisksPreview
            pDisks={[{...pDisk, AllocatedPercent: 80, Severity: 5}]}
            vDisks={[...vDisks.slice(0, 5), {...vDisks[5], Severity: 5}]}
        />,
    );
    expect(svg).toHaveAttribute('width', '13');
    expect(svg.querySelectorAll('path')).toHaveLength(4);
    expect(
        Number(
            svg.querySelector('.ydb-storage-pdisks-preview__pdisk-fill')?.getAttribute('height'),
        ),
    ).toBeCloseTo(32.8);
    expect(svg.querySelector('.ydb-storage-pdisks-preview__pdisk-border')).toHaveClass(
        'ydb-storage-pdisks-preview__color_red',
    );
});

test('inverts PDisk allocation and keeps unrelated disks dimmed', () => {
    mockInverted = true;
    const {container} = render(
        <PDisksPreview pDisks={[pDisk]} vDisks={vDisks} viewContext={{nodeId: '2'}} />,
    );
    expect(container.querySelector('svg g')).toHaveAttribute('opacity', '0.5');
    expect(container.querySelector('.ydb-storage-pdisks-preview__pdisk-fill')).toHaveAttribute(
        'height',
        '30.75',
    );
    expect(container.querySelector('.ydb-storage-pdisks-preview__pdisk-fill')).toHaveAttribute(
        'y',
        '0',
    );
    expect(container.querySelector('path')?.parentElement).toHaveAttribute('opacity', '0.5');
});

test('closing details clears highlight and ignores callbacks from the previous expansion', () => {
    render(<PDisksPreview pDisks={[pDisk]} vDisks={vDisks} />);
    fireEvent.click(screen.getByRole('button', {name: 'Show PDisk 1-1 details'}));
    expect(mockDetailsProps.highlighted).toBe(false);
    const delayedShow = mockDetailsProps.onShowPopup;
    fireEvent.click(screen.getByRole('button', {name: 'Expanded PDisk'}), {detail: 1});
    fireEvent.click(screen.getByRole('button', {name: 'Show PDisk 1-1 details'}));

    act(() => delayedShow?.());
    expect(mockDetailsProps.highlighted).toBe(false);
    act(() => mockDetailsProps.onShowPopup?.());
    expect(mockDetailsProps.highlighted).toBe(true);
});

test('collapsing another group and its delayed hide callback preserve the highlighted owner', () => {
    const secondDisk = {...pDisk, PDiskId: 2, StringifiedId: '1-2'};
    render(<PDisksPreview pDisks={[pDisk, secondDisk]} vDisks={vDisks} />);
    fireEvent.click(screen.getByRole('button', {name: 'Show PDisk 1-1 details'}));
    fireEvent.click(screen.getByRole('button', {name: 'Show PDisk 1-2 details'}));
    const firstHide = mockDetailsById.get('1-1')?.onHidePopup;
    act(() => mockDetailsById.get('1-2')?.onShowPopup?.());
    act(() => firstHide?.());
    expect(mockDetailsById.get('1-2')?.highlighted).toBe(true);
    fireEvent.click(screen.getAllByRole('button', {name: 'Expanded PDisk'})[0], {detail: 1});
    expect(mockDetailsById.get('1-2')?.highlighted).toBe(true);
});

test('keyboard activation is not cancelled and Escape collapses only the focused disk', () => {
    const outerKeyDown = jest.fn();
    render(
        <div onKeyDown={outerKeyDown}>
            <PDisksPreview pDisks={[pDisk]} vDisks={vDisks} />
        </div>,
    );
    const preview = screen.getByRole('button', {name: 'Show PDisk 1-1 details'});
    fireEvent.click(preview);
    const details = screen.getByRole('button', {name: 'Expanded PDisk'});
    expect(fireEvent.click(details, {detail: 0})).toBe(true);
    expect(details).toBeVisible();

    fireEvent.keyDown(details, {key: 'Escape'});
    expect(outerKeyDown).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', {name: 'Expanded PDisk'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Show PDisk 1-1 details'})).toHaveFocus();
});

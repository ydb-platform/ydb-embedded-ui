import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';

import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {PDisk} from '../PDisk';

import {PDisksPreview} from './PDisksPreview';

let mockInverted = false;
let mockDetailsProps: React.ComponentProps<typeof PDisk>;

jest.mock('../../../utils/hooks/useSetting', () => ({useSetting: () => [mockInverted]}));
jest.mock('../../../store', () => ({singleClusterMode: true}));
jest.mock('../PDisk', () => ({
    PDisk: (props: React.ComponentProps<typeof PDisk>) => {
        mockDetailsProps = props;
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
    fireEvent.click(screen.getByRole('button', {name: 'Expanded PDisk'}));
    fireEvent.click(screen.getByRole('button', {name: 'Show PDisk 1-1 details'}));

    act(() => delayedShow?.());
    expect(mockDetailsProps.highlighted).toBe(false);
    act(() => mockDetailsProps.onShowPopup?.());
    expect(mockDetailsProps.highlighted).toBe(true);
});

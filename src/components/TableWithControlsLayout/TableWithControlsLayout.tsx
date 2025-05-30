import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import {useTableScroll} from './useTableScroll';

import './TableWithControlsLayout.scss';

const b = cn('ydb-table-with-controls-layout');

interface TableWithControlsLayoutItemProps {
    children?: React.ReactNode;
    renderExtraControls?: () => React.ReactNode;
    className?: string;
    fullHeight?: boolean;
}

export interface TableProps extends Omit<TableWithControlsLayoutItemProps, 'children'> {
    loading?: boolean;
    scrollContainerRef?: React.RefObject<HTMLElement>;
    scrollDependencies?: any[];

    // onSort is called with the table's sort parameters and triggers auto-scrolling.
    onSort?: (params: any) => void;
    children?: React.ReactNode | ((props: {onSort: (params: any) => void}) => React.ReactNode);
}

export const TableWithControlsLayout = ({
    children,
    className,
    fullHeight,
}: TableWithControlsLayoutItemProps) => {
    return <div className={b({'full-height': fullHeight}, className)}>{children}</div>;
};

TableWithControlsLayout.Controls = function TableControls({
    children,
    renderExtraControls,
    className,
}: TableWithControlsLayoutItemProps) {
    return (
        <Flex
            justifyContent="space-between"
            alignItems="center"
            className={b('controls-wrapper')}
            gap={2}
        >
            <div className={b('controls', className)}>{children}</div>
            {renderExtraControls?.()}
        </Flex>
    );
};

TableWithControlsLayout.Table = function Table({
    children,
    loading,
    className,
    scrollContainerRef,
    scrollDependencies = [],
    onSort,
}: TableProps) {
    // Create an internal ref for the table container
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Use the internal ref for scrolling
    const {handleTableScroll} = useTableScroll({
        tableContainerRef,
        scrollContainerRef,
        dependencies: scrollDependencies,
    });

    // Create a wrapper function that triggers scroll on sort
    const handleSort = React.useCallback(
        (params: any) => {
            onSort?.(params); // Call original callback if provided
            handleTableScroll(); // Trigger scroll to top
        },
        [onSort, handleTableScroll],
    );

    if (loading) {
        return <TableSkeleton className={b('loader')} />;
    }

    return (
        <div ref={tableContainerRef} className={b('table', className)}>
            {typeof children === 'function' ? children({onSort: handleSort}) : children}
        </div>
    );
};

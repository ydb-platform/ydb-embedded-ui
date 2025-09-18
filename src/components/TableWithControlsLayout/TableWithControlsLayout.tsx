import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import {useTableScroll} from './useTableScroll';

import './TableWithControlsLayout.scss';

const b = cn('ydb-table-with-controls-layout');

interface TableWithControlsLayoutItemProps {
    children: React.ReactNode;
    renderExtraControls?: () => React.ReactNode;
    className?: string;
    fullHeight?: boolean;
}

export interface TableWrapperProps extends Omit<TableWithControlsLayoutItemProps, 'children'> {
    loading?: boolean;
    scrollContainerRef?: React.RefObject<HTMLElement>;
    scrollDependencies?: any[];
    children: React.ReactNode;
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
        <Flex justifyContent="space-between" className={b('controls-wrapper')} gap={2}>
            <div className={b('controls', className)}>{children}</div>
            <div className={b('extra-controls')}>{renderExtraControls?.()}</div>
        </Flex>
    );
};

TableWithControlsLayout.Table = function Table({
    children,
    loading,
    className,
    scrollContainerRef,
    scrollDependencies = [],
}: TableWrapperProps) {
    // Create an internal ref for the table container
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Use the internal ref for scrolling
    useTableScroll({
        tableContainerRef,
        scrollContainerRef,
        dependencies: scrollDependencies,
    });

    if (loading) {
        return <TableSkeleton className={b('loader')} />;
    }

    return (
        <div ref={tableContainerRef} className={b('table', className)}>
            {children}
        </div>
    );
};

import {Flex} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import './TableWithControlsLayout.scss';

const b = cn('ydb-table-with-controls-layout');

interface TableWithControlsLayoutItemProps {
    children: React.ReactNode;
    renderExtraControls?: () => React.ReactNode;
    className?: string;
}

interface TableProps extends TableWithControlsLayoutItemProps {
    loading?: boolean;
}

export const TableWithControlsLayout = ({
    children,
    className,
}: TableWithControlsLayoutItemProps) => {
    return <div className={b(null, className)}>{children}</div>;
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
            {renderExtraControls()}
        </Flex>
    );
};

TableWithControlsLayout.Table = function Table({children, loading, className}: TableProps) {
    if (loading) {
        return <TableSkeleton className={b('loader')} />;
    }

    return <div className={b('table', className)}>{children}</div>;
};

import {ResponseError} from '../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {nodeApi} from '../../../store/reducers/node/node';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';

import {columns} from './columns';
import i18n from './i18n';

interface ThreadsProps {
    nodeId: string;
    className?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

const THREADS_COLUMNS_WIDTH_LS_KEY = 'threadsTableColumnsWidth';

export function Threads({nodeId, className, scrollContainerRef}: ThreadsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {
        currentData: nodeData,
        isLoading,
        error,
    } = nodeApi.useGetNodeInfoQuery({nodeId}, {pollingInterval: autoRefreshInterval});

    const data = nodeData?.Threads || [];

    return (
        <TableWithControlsLayout fullHeight className={className}>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table scrollContainerRef={scrollContainerRef}>
                <ResizeableDataTable
                    columnsWidthLSKey={THREADS_COLUMNS_WIDTH_LS_KEY}
                    data={data}
                    columns={columns}
                    settings={DEFAULT_TABLE_SETTINGS}
                    emptyDataMessage={i18n('alert_no-thread-data')}
                    isLoading={isLoading}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}

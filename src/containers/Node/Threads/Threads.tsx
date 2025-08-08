import {ResponseError} from '../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {nodeApi} from '../../../store/reducers/node/node';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';

import {columns} from './columns';
import i18n from './i18n';

interface ThreadsProps {
    nodeId: string;
    className?: string;
}

const THREADS_COLUMNS_WIDTH_LS_KEY = 'threadsTableColumnsWidth';

export function Threads({nodeId, className}: ThreadsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {
        currentData: nodeData,
        isLoading,
        error,
    } = nodeApi.useGetNodeInfoQuery({nodeId}, {pollingInterval: autoRefreshInterval});

    const data = nodeData?.Threads || [];

    return (
        <LoaderWrapper loading={isLoading} className={className}>
            {error ? <ResponseError error={error} /> : null}
            <ResizeableDataTable
                columnsWidthLSKey={THREADS_COLUMNS_WIDTH_LS_KEY}
                data={data}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                emptyDataMessage={i18n('alert_no-thread-data')}
            />
        </LoaderWrapper>
    );
}

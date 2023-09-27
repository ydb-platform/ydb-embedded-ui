import cn from 'bem-cn-lite';
import {useDispatch} from 'react-redux';
import {useCallback} from 'react';

import DataTable from '@gravity-ui/react-data-table';

import {DEFAULT_TABLE_SETTINGS} from '../../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    getTopComputeNodes,
    getTopNodes,
    selectTopNodes,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topNodes/topNodes';
import type {EPathType} from '../../../../../types/api/schema';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {Illustration} from '../../../../../components/Illustration';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {getTopNodesColumns} from '../../../../Nodes/getNodesColumns';
import {isDatabaseEntityType} from '../../../utils/schema';

import './TenantCpu.scss';
import i18n from '../i18n';

const b = cn('tenant-overview-cpu');

interface TopNodesProps {
    path?: string;
    type?: EPathType;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodes({path, type, additionalNodesProps}: TopNodesProps) {
    const dispatch = useDispatch();

    const {wasLoaded, loading, error} = useTypedSelector((state) => state.topNodes);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const topNodes = useTypedSelector(selectTopNodes);
    const columns = getTopNodesColumns(additionalNodesProps?.getNodeRef);

    const fetchNodes = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            // For not DB entities we always use /compute endpoint instead of /nodes
            // since /nodes can return data only for tenants
            if (path && !isDatabaseEntityType(type)) {
                dispatch(getTopComputeNodes({path}));
            } else {
                dispatch(getTopNodes({tenant: path}));
            }
        },
        [dispatch, path, type],
    );

    useAutofetcher(fetchNodes, [fetchNodes], autorefresh);

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={5} />;
        }

        if (topNodes && topNodes.length === 0) {
            return <Illustration name="thumbsUp" width="200" />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={topNodes || []}
                columns={columns}
                settings={{...DEFAULT_TABLE_SETTINGS, stickyHead: 'fixed', dynamicRender: false}}
                emptyDataMessage={i18n('top-nodes.empty-data')}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top nodes by load</div>
            <div className={b('table')}>{renderContent()}</div>
        </>
    );
}

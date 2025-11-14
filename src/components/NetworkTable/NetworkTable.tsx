import {Nodes} from '../../containers/Nodes/Nodes';
import type {NodesProps} from '../../containers/Nodes/Nodes';

import {getNetworkTableNodesColumns} from './columns';
import {
    NETWORK_DEFAULT_NODES_COLUMNS,
    NETWORK_NODES_GROUP_BY_PARAMS,
    NETWORK_NODES_TABLE_SELECTED_COLUMNS_KEY,
    NETWORK_REQUIRED_NODES_COLUMNS,
} from './constants';

type NetworkWrapperProps = Pick<
    NodesProps,
    'path' | 'scrollContainerRef' | 'database' | 'databaseFullPath' | 'nodeId'
>;

export function NetworkTable({
    database,
    databaseFullPath,
    path,
    scrollContainerRef,
    nodeId,
}: NetworkWrapperProps) {
    return (
        <Nodes
            path={path}
            database={database}
            databaseFullPath={databaseFullPath}
            scrollContainerRef={scrollContainerRef}
            withPeerRoleFilter={Boolean(database)}
            columns={getNetworkTableNodesColumns({database})}
            defaultColumnsIds={NETWORK_DEFAULT_NODES_COLUMNS}
            requiredColumnsIds={NETWORK_REQUIRED_NODES_COLUMNS}
            selectedColumnsKey={NETWORK_NODES_TABLE_SELECTED_COLUMNS_KEY}
            groupByParams={NETWORK_NODES_GROUP_BY_PARAMS}
            nodeId={nodeId}
        />
    );
}

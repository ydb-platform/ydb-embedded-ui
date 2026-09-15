import {getDefaultNodePath} from '../../routes';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {NodeAddress} from '../../types/additionalProps';
import type {TNodeInfo, TSystemStateInfo} from '../../types/api/nodes';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {checkIsStorageNode, isUnavailableNode} from '../../utils/nodes';
import type {PreparedNodeSystemState} from '../../utils/nodes';
import {EntityName} from '../EntityName/EntityName';
import {StatusColor} from '../StatusColor/StatusColor';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';

export type NodeHostData = NodeAddress &
    Pick<TNodeInfo, 'ConnectStatus'> &
    Pick<TSystemStateInfo, 'SystemState'> & {
        NodeId: string | number;
        TenantName?: string;
    };

interface NodeHostWrapperProps {
    node: PreparedStorageNode;
    database?: string;
    statusForIcon?: 'SystemState' | 'ConnectStatus';
}

export function getNodeHostPath(node: PreparedNodeSystemState, database?: string) {
    if (!node.Host || node.NodeId === undefined || isUnavailableNode(node)) {
        return undefined;
    }

    const databaseInPath = checkIsStorageNode(node) ? undefined : (database ?? node.TenantName);

    return getDefaultNodePath(
        {id: node.NodeId, activeTab: node.TenantName ? 'tablets' : 'storage'},
        {database: databaseInPath},
    );
}

export function getNodeHostLabel(node: PreparedNodeSystemState) {
    return (
        [node.NodeId, node.Host]
            .filter((value) => value !== undefined && value !== null && value !== '')
            .join(', ') || EMPTY_DATA_PLACEHOLDER
    );
}

export const NodeHostWrapper = ({
    node,
    database,
    statusForIcon = 'SystemState',
}: NodeHostWrapperProps) => {
    if (!node.Host) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const status = statusForIcon === 'ConnectStatus' ? node.ConnectStatus : node.SystemState;

    const isNodeAvailable = !isUnavailableNode(node);

    const nodePath = getNodeHostPath(node, database);

    return (
        <EntityName
            name={node.Host}
            path={nodePath}
            hasClipboardButton
            leadingContent={<StatusColor status={status} />}
            infoPopoverContent={
                isNodeAvailable ? <NodeEndpointsTooltipContent data={node} /> : null
            }
        />
    );
};

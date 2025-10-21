import {getDefaultNodePath} from '../../routes';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {NodeAddress} from '../../types/additionalProps';
import type {TNodeInfo, TSystemStateInfo} from '../../types/api/nodes';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {isUnavailableNode} from '../../utils/nodes';
import {EntityStatus} from '../EntityStatus/EntityStatus';
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

    const nodePath = isNodeAvailable
        ? getDefaultNodePath(
              {id: node.NodeId, activeTab: node.TenantName ? 'tablets' : 'storage'},
              {
                  database: database ?? node.TenantName,
              },
          )
        : undefined;

    return (
        <EntityStatus
            name={node.Host}
            status={status}
            path={nodePath}
            hasClipboardButton
            infoPopoverContent={
                isNodeAvailable ? <NodeEndpointsTooltipContent data={node} /> : null
            }
        />
    );
};

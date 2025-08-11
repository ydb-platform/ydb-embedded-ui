import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {GetNodeRefFunc, NodeAddress} from '../../types/additionalProps';
import type {TNodeInfo, TSystemStateInfo} from '../../types/api/nodes';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
} from '../../utils/developerUI/developerUI';
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
    node: NodeHostData;
    getNodeRef?: GetNodeRefFunc;
    database?: string;
    statusForIcon?: 'SystemState' | 'ConnectStatus';
}

export const NodeHostWrapper = ({
    node,
    getNodeRef,
    database,
    statusForIcon = 'SystemState',
}: NodeHostWrapperProps) => {
    if (!node.Host) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const status = statusForIcon === 'ConnectStatus' ? node.ConnectStatus : node.SystemState;

    const isNodeAvailable = !isUnavailableNode(node);

    let developerUIInternalHref: string | undefined;
    if (getNodeRef) {
        const developerUIHref = getNodeRef(node);
        developerUIInternalHref = developerUIHref
            ? createDeveloperUIInternalPageHref(developerUIHref)
            : undefined;
    } else if (node.NodeId) {
        const developerUIHref = createDeveloperUILinkWithNodeId(node.NodeId);
        developerUIInternalHref = createDeveloperUIInternalPageHref(developerUIHref);
    }

    const nodePath = isNodeAvailable
        ? getDefaultNodePath(
              node.NodeId,
              {
                  database: database ?? node.TenantName,
              },
              node.TenantName ? 'tablets' : 'storage',
          )
        : undefined;

    return (
        <EntityStatus
            name={node.Host}
            status={status}
            path={nodePath}
            hasClipboardButton
            infoPopoverContent={
                isNodeAvailable ? (
                    <NodeEndpointsTooltipContent data={node} nodeHref={developerUIInternalHref} />
                ) : null
            }
        />
    );
};

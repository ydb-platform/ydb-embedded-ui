import {PopoverBehavior} from '@gravity-ui/uikit';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {NodeAddress} from '../../types/additionalProps';
import type {TSystemStateInfo} from '../../types/api/nodes';
import {createDeveloperUILinkWithNodeId} from '../../utils/developerUI/developerUI';
import {isUnavailableNode} from '../../utils/nodes';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';

export type NodeHostData = NodeAddress &
    Pick<TSystemStateInfo, 'SystemState'> & {
        NodeId: string | number;
        TenantName?: string;
    };

interface NodeHostWrapperProps {
    node: NodeHostData;
    getNodeRef?: (node?: NodeAddress) => string | null;
    database?: string;
}

export const NodeHostWrapper = ({node, getNodeRef, database}: NodeHostWrapperProps) => {
    if (!node.Host) {
        return <span>—</span>;
    }

    const isNodeAvailable = !isUnavailableNode(node);

    let nodeHref: string | undefined;
    if (getNodeRef) {
        nodeHref = getNodeRef(node) + 'internal';
    } else if (node.NodeId) {
        nodeHref = createDeveloperUILinkWithNodeId(node.NodeId) + 'internal';
    }

    const nodePath = isNodeAvailable
        ? getDefaultNodePath(node.NodeId, {
              tenantName: database ?? node.TenantName,
          })
        : undefined;

    return (
        <CellWithPopover
            disabled={!isNodeAvailable}
            content={<NodeEndpointsTooltipContent data={node} nodeHref={nodeHref} />}
            placement={['top', 'bottom']}
            behavior={PopoverBehavior.Immediate}
        >
            <EntityStatus
                name={node.Host}
                status={node.SystemState}
                path={nodePath}
                hasClipboardButton
            />
        </CellWithPopover>
    );
};

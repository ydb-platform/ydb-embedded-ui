import {PopoverBehavior} from '@gravity-ui/uikit';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {NodeAddress} from '../../types/additionalProps';
import type {TSystemStateInfo} from '../../types/api/nodes';
import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
} from '../../utils/developerUI/developerUI';
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
        ? getDefaultNodePath(node.NodeId, {
              database: database ?? node.TenantName,
          })
        : undefined;

    return (
        <CellWithPopover
            disabled={!isNodeAvailable}
            content={<NodeEndpointsTooltipContent data={node} nodeHref={developerUIInternalHref} />}
            placement={['top', 'bottom']}
            behavior={PopoverBehavior.Immediate}
            delayClosing={200}
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

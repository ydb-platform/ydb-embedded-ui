import {PopoverBehavior} from '@gravity-ui/uikit';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {NodeAddress} from '../../types/additionalProps';
import type {TNodeInfo, TSystemStateInfo} from '../../types/api/nodes';
import {
    createBaseDeveloperUILinkWithNodeId,
    createDeveloperUIInternalPageHref,
} from '../../utils/developerUI/developerUI';
import {isUnavailableNode} from '../../utils/nodes';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';

export type NodeHostData = NodeAddress &
    Pick<TNodeInfo, 'ConnectStatus'> &
    Pick<TSystemStateInfo, 'SystemState'> & {
        NodeId: string | number;
        TenantName?: string;
    };

export type StatusForIcon = 'SystemState' | 'ConnectStatus';

interface NodeHostWrapperProps {
    node: NodeHostData;
    getNodeRef?: (node?: NodeAddress) => string | null;
    database?: string;
    statusForIcon?: StatusForIcon;
}

export const NodeHostWrapper = ({
    node,
    getNodeRef,
    database,
    statusForIcon,
}: NodeHostWrapperProps) => {
    if (!node.Host) {
        return <span>—</span>;
    }

    const status = statusForIcon === 'ConnectStatus' ? node.ConnectStatus : node.SystemState;

    const isNodeAvailable = !isUnavailableNode(node);

    let developerUIInternalHref: string | undefined;
    if (getNodeRef) {
        const developerUIHref = getNodeRef(node);
        developerUIInternalHref = developerUIHref
            ? createDeveloperUIInternalPageHref(developerUIHref, database)
            : undefined;
    } else if (node.NodeId) {
        const developerUIHref = createBaseDeveloperUILinkWithNodeId(node.NodeId);
        developerUIInternalHref = createDeveloperUIInternalPageHref(developerUIHref, database);
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
        <CellWithPopover
            disabled={!isNodeAvailable}
            content={<NodeEndpointsTooltipContent data={node} nodeHref={developerUIInternalHref} />}
            placement={['top', 'bottom']}
            behavior={PopoverBehavior.Immediate}
            delayClosing={200}
        >
            <EntityStatus name={node.Host} status={status} path={nodePath} hasClipboardButton />
        </CellWithPopover>
    );
};

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button, Icon, PopoverBehavior} from '@gravity-ui/uikit';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {NodeAddress} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {createDeveloperUILinkWithNodeId} from '../../utils/developerUI/developerUI';
import {isUnavailableNode} from '../../utils/nodes';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';

import './NodeHostWrapper.scss';

const b = cn('ydb-node-host-wrapper');

interface NodeHostWrapperProps {
    node: NodesPreparedEntity;
    getNodeRef?: (node?: NodeAddress) => string | null;
}

export const NodeHostWrapper = ({node, getNodeRef}: NodeHostWrapperProps) => {
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
              tenantName: node.TenantName,
          })
        : undefined;

    const additionalControls = nodeHref ? (
        <Button size="s" href={nodeHref} className={b('external-button')} target="_blank">
            <Icon data={ArrowUpRightFromSquare} />
        </Button>
    ) : null;

    return (
        <CellWithPopover
            disabled={!isNodeAvailable}
            content={<NodeEndpointsTooltipContent data={node} />}
            placement={['top', 'bottom']}
            behavior={PopoverBehavior.Immediate}
        >
            <EntityStatus
                name={node.Host}
                status={node.SystemState}
                path={nodePath}
                hasClipboardButton
                additionalControls={additionalControls}
            />
        </CellWithPopover>
    );
};

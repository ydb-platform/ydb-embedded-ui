import {Button, PopoverBehavior} from '@gravity-ui/uikit';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {NodeAddress} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {isUnavailableNode} from '../../utils/nodes';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {Icon} from '../Icon';
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
    const nodeRef = isNodeAvailable && getNodeRef ? getNodeRef(node) + 'internal' : undefined;
    const nodePath = isNodeAvailable
        ? getDefaultNodePath(node.NodeId, {
              tenantName: node.TenantName,
          })
        : undefined;

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
                className={b('host')}
            />
            {nodeRef && (
                <Button size="s" href={nodeRef} className={b('external-button')} target="_blank">
                    <Icon name="external" />
                </Button>
            )}
        </CellWithPopover>
    );
};

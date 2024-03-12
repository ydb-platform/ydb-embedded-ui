import block from 'bem-cn-lite';

import {Button, PopoverBehavior} from '@gravity-ui/uikit';

import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {NodeAddress} from '../../types/additionalProps';
import {getDefaultNodePath} from '../../containers/Node/NodePages';
import {isUnavailableNode} from '../../utils/nodes';

import {EntityStatus} from '../EntityStatus/EntityStatus';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';
import {Icon} from '../Icon';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';

import './NodeHostWrapper.scss';

const b = block('ydb-node-host-wrapper');

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
            <div className={b('host-wrapper')}>
                <EntityStatus
                    name={node.Host}
                    status={node.SystemState}
                    path={nodePath}
                    hasClipboardButton
                    className={b('host')}
                />
                {nodeRef && (
                    <Button
                        size="s"
                        href={nodeRef}
                        className={b('external-button')}
                        target="_blank"
                    >
                        <Icon name="external" />
                    </Button>
                )}
            </div>
        </CellWithPopover>
    );
};

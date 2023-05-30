import block from 'bem-cn-lite';

import {Button, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import type {INodesPreparedEntity} from '../../types/store/nodes';
import {getDefaultNodePath} from '../../containers/Node/NodePages';
import {isUnavailableNode, NodeAddress} from '../../utils/nodes';

import EntityStatus from '../EntityStatus/EntityStatus';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';
import {IconWrapper} from '../Icon';

import './NodeHostWrapper.scss';

const b = block('ydb-node-host-wrapper');

interface NodeHostWrapperProps {
    node: INodesPreparedEntity;
    getNodeRef?: (node?: NodeAddress) => string;
}

export const NodeHostWrapper = ({node, getNodeRef}: NodeHostWrapperProps) => {
    if (!node.Host) {
        return <span>—</span>;
    }

    const isNodeAvailable = !isUnavailableNode(node);
    const nodeRef = isNodeAvailable && getNodeRef ? getNodeRef(node) + 'internal' : undefined;

    return (
        <div className={b()}>
            <Popover
                disabled={!isNodeAvailable}
                content={<NodeEndpointsTooltipContent data={node} />}
                placement={['top', 'bottom']}
                behavior={PopoverBehavior.Immediate}
            >
                <div className={b('host-wrapper')}>
                    <EntityStatus
                        name={node.Host}
                        status={node.SystemState}
                        path={isNodeAvailable ? getDefaultNodePath(node.NodeId) : undefined}
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
                            <IconWrapper name="external" />
                        </Button>
                    )}
                </div>
            </Popover>
        </div>
    );
};

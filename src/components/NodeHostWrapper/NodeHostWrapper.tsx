import {CircleQuestion} from '@gravity-ui/icons';
import {Icon, Tooltip} from '@gravity-ui/uikit';

import {getDefaultNodePath} from '../../routes';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {NodeAddress} from '../../types/additionalProps';
import type {TNodeInfo, TSystemStateInfo} from '../../types/api/nodes';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {checkIsStorageNode, isNodeResponseTimedOut, isUnavailableNode} from '../../utils/nodes';
import type {PreparedNodeSystemState} from '../../utils/nodes';
import {EntityName} from '../EntityName/EntityName';
import {StatusColor} from '../StatusColor/StatusColor';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';

import i18n from './i18n';

import './NodeHostWrapper.scss';

const b = cn('ydb-node-host-wrapper');

export const NODE_STATE_UNKNOWN_QA = 'node-state-unknown';

export type NodeHostData = NodeAddress &
    Pick<TNodeInfo, 'ConnectStatus'> &
    Pick<TSystemStateInfo, 'SystemState'> & {
        NodeId: string | number;
        TenantName?: string;
    };

interface NodeHostPathOptions {
    /**
     * The node is from a table of storage nodes. A node that did not answer in time has no roles
     * and no tenant to tell what it is, so the table it is listed in has to say that.
     */
    storageNodes?: boolean;
}

interface NodeHostWrapperProps extends NodeHostPathOptions {
    node: PreparedStorageNode;
    database?: string;
    statusForIcon?: 'SystemState' | 'ConnectStatus';
}

export function getNodeHostPath(
    node: PreparedNodeSystemState & Pick<TNodeInfo, 'ResponseTimeout'>,
    database?: string,
    {storageNodes = false}: NodeHostPathOptions = {},
) {
    if (!node.Host || node.NodeId === undefined) {
        return undefined;
    }
    // A node that only did not answer in time may be alive, and its page makes its own request
    const hasNoState = isNodeResponseTimedOut(node);
    if (isUnavailableNode(node) && !hasNoState) {
        return undefined;
    }

    // Without the state the kind of the node follows from where it is listed:
    // a table of storage nodes, or the nodes of a database
    const isStorageNode = hasNoState ? storageNodes : checkIsStorageNode(node);
    const isDatabaseNode = hasNoState
        ? !storageNodes && Boolean(database)
        : Boolean(node.TenantName);
    const databaseInPath = isStorageNode ? undefined : (database ?? node.TenantName);

    return getDefaultNodePath(
        {id: node.NodeId, activeTab: isDatabaseNode ? 'tablets' : 'storage'},
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

function NodeStateUnknownIcon() {
    const message = i18n('context_response-timeout');

    return (
        <Tooltip content={message}>
            <span
                className={b('state-unknown')}
                role="img"
                aria-label={message}
                data-qa={NODE_STATE_UNKNOWN_QA}
            >
                <Icon data={CircleQuestion} size={16} />
            </span>
        </Tooltip>
    );
}

export const NodeHostWrapper = ({
    node,
    database,
    statusForIcon = 'SystemState',
    storageNodes,
}: NodeHostWrapperProps) => {
    if (!node.Host) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const status = statusForIcon === 'ConnectStatus' ? node.ConnectStatus : node.SystemState;

    const isNodeAvailable = !isUnavailableNode(node);
    // ConnectStatus is known from the peers of the node, so it stays as is
    const isStateUnknown = statusForIcon === 'SystemState' && isNodeResponseTimedOut(node);

    const nodePath = getNodeHostPath(node, database, {storageNodes});

    return (
        <EntityName
            name={node.Host}
            path={nodePath}
            hasClipboardButton
            leadingContent={
                isStateUnknown ? <NodeStateUnknownIcon /> : <StatusColor status={status} />
            }
            infoPopoverContent={
                isNodeAvailable ? <NodeEndpointsTooltipContent data={node} /> : null
            }
        />
    );
};

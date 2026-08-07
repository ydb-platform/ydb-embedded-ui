import {getDefaultNodePath} from '../../routes';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {NodeAddress} from '../../types/additionalProps';
import type {TNodeInfo, TSystemStateInfo} from '../../types/api/nodes';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {checkIsStorageNode, isUnavailableNode} from '../../utils/nodes';
import {EntityName} from '../EntityName/EntityName';
import {StatusColor} from '../StatusColor/StatusColor';
import {NodeEndpointsTooltipContent} from '../TooltipsContent';

const b = cn('entity-status');

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

    // Storage nodes do not belong to any specific database.
    // Including a database in the path would filter data on the node page by that database,
    // but for storage nodes this would result in no data being shown.
    // Database from node data cannot be used, because we use database ids when uiFactory.useDatabaseId
    // https://github.com/ydb-platform/ydb-embedded-ui/issues/3006
    const databaseInPath = checkIsStorageNode(node) ? undefined : (database ?? node.TenantName);

    const nodePath = isNodeAvailable
        ? getDefaultNodePath(
              {id: node.NodeId, activeTab: node.TenantName ? 'tablets' : 'storage'},
              {database: databaseInPath},
          )
        : undefined;

    return (
        <EntityName
            name={node.Host}
            path={nodePath}
            hasClipboardButton
            leadingContent={<StatusColor className={b('icon')} status={status} />}
            infoPopoverContent={
                isNodeAvailable ? <NodeEndpointsTooltipContent data={node} /> : null
            }
        />
    );
};

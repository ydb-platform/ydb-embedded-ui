import type {NodesPeerRole} from '../../../types/api/nodes';
import i18n from '../i18n';

export const NODES_PEER_ROLES: NodesPeerRole[] = ['database', 'static', 'other', 'any'];

export const NODES_PEER_ROLES_TITLES: Record<NodesPeerRole, string> = {
    get database() {
        return i18n('database');
    },
    get static() {
        return i18n('static');
    },
    get other() {
        return i18n('other');
    },
    get any() {
        return i18n('any');
    },
};

export function parseNodesPeerRoleFilter(
    paramToParse: unknown,
    defaultValue?: NodesPeerRole,
): NodesPeerRole | undefined {
    return NODES_PEER_ROLES.find((peerRoleParam) => peerRoleParam === paramToParse) ?? defaultValue;
}

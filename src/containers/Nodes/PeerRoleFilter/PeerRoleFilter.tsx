import {RadioButton} from '@gravity-ui/uikit';

import type {NodesPeerRole} from '../../../types/api/nodes';

import {NODES_PEER_ROLES, NODES_PEER_ROLES_TITLES} from './utils';

interface PeerRoleFilterProps {
    value?: NodesPeerRole;
    onChange: (value: NodesPeerRole) => void;
}

export function PeerRoleFilter({value = 'database', onChange}: PeerRoleFilterProps) {
    return (
        <RadioButton value={value} onUpdate={onChange}>
            {NODES_PEER_ROLES.map((role) => {
                return (
                    <RadioButton.Option key={role} value={role}>
                        {NODES_PEER_ROLES_TITLES[role]}
                    </RadioButton.Option>
                );
            })}
        </RadioButton>
    );
}

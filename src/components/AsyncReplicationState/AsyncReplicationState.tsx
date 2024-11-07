import {Label} from '@gravity-ui/uikit';

import type {TReplicationState} from '../../types/api/schema/replication';

interface AsyncReplicationStateProps {
    state?: TReplicationState;
}

export function AsyncReplicationState({state}: AsyncReplicationStateProps) {
    if (!state) {
        return null;
    }

    if ('StandBy' in state) {
        return <Label theme="info">Standby</Label>;
    }
    if ('Paused' in state) {
        return <Label theme="info">Paused</Label>;
    }
    if ('Done' in state) {
        return <Label theme="success">Done</Label>;
    }
    if ('Error' in state) {
        return <Label theme="danger">Error</Label>;
    }

    return <Label size="s">{'Unknown'}</Label>;
}

import type {EFlag} from '../../../../../types/api/enums';
import {cn} from '../../../../../utils/cn';

import './NodesState.scss';

const b = cn('ydb-nodes-state');

interface NodesStateProps {
    state: EFlag;
    children: React.ReactNode;
}

export function NodesState({state, children}: NodesStateProps) {
    return <div className={b({[state.toLowerCase()]: true})}>{children}</div>;
}

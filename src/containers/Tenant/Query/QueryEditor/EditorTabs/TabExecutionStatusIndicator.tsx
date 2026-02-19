import {cn} from '../../../../../utils/cn';

import './TabExecutionStatusIndicator.scss';

const b = cn('tab-execution-status-indicator');

export type TabExecutionStatus = 'in_progress' | 'done' | 'failed' | 'stopped';

interface TabExecutionStatusIndicatorProps {
    status?: TabExecutionStatus;
}

export function TabExecutionStatusIndicator({status}: TabExecutionStatusIndicatorProps) {
    if (!status) {
        return null;
    }

    return <span className={b({[status]: true})} />;
}

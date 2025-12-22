import {CircleCheckFill, CircleXmarkFill} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../../../../../utils/cn';

import './StatusIcon.scss';

const b = cn('ydb-diagnostics-table-info-status-icon');

type StatusIconProps = {
    value: boolean;
    className?: string;
};

export const StatusIcon = ({value, className}: StatusIconProps) => {
    return (
        <div className={b('status-icon', {state: value ? 'ok' : 'no'}, className)}>
            <Icon data={value ? CircleCheckFill : CircleXmarkFill} size={16} />
        </div>
    );
};

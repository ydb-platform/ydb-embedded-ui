import {
    CircleExclamationFill,
    CircleInfoFill,
    CircleXmarkFill,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import type {SEVERITY} from './models';

const severityIcons: Record<SEVERITY, IconData> = {
    S_INFO: CircleInfoFill,
    S_WARNING: CircleExclamationFill,
    S_ERROR: TriangleExclamationFill,
    S_FATAL: CircleXmarkFill,
};

const b = cn('yql-issue-severity');

export function IssueSeverity({severity}: {severity: SEVERITY}) {
    const shortenSeverity = severity.slice(2).toLowerCase();
    return (
        <span className={b({severity: shortenSeverity})}>
            <Icon className={b('icon')} data={severityIcons[severity]} />
            <span className={b('title')}>{shortenSeverity}</span>
        </span>
    );
}

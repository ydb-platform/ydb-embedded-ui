import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Label} from '@gravity-ui/uikit';

import type {SelfCheckResult} from '../../types/api/healthcheck';
import {cn} from '../../utils/cn';
import {getSelfCheckView} from '../../utils/healthStatus/selfCheck';

import './HealthcheckStatus.scss';

const b = cn('ydb-healthcheck-status');

interface HealthcheckStatusProps {
    status: SelfCheckResult;
    size?: LabelProps['size'];
}

export function HealthcheckStatus({status, size = 'm'}: HealthcheckStatusProps) {
    const {theme, icon, text} = getSelfCheckView(status);

    return (
        <Label
            className={b({critical: theme === 'critical'})}
            theme={theme === 'critical' ? undefined : theme}
            icon={<Icon size={14} data={icon} />}
            size={size}
        >
            {text}
        </Label>
    );
}

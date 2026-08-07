import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Label} from '@gravity-ui/uikit';

import type {SelfCheckResult} from '../../types/api/healthcheck';
import {cn} from '../../utils/cn';

import {SELF_CHECK_RESULT_CONFIG} from './config';

import './HealthcheckStatus.scss';

const b = cn('ydb-healthcheck-status');

interface HealthcheckStatusProps {
    status: SelfCheckResult;
    size?: LabelProps['size'];
}

export function HealthcheckStatus({status, size = 's'}: HealthcheckStatusProps) {
    const config = SELF_CHECK_RESULT_CONFIG[status];

    return (
        <Label
            theme={config.labelTheme}
            icon={<Icon size={14} data={config.icon} />}
            size={size}
            className={b({emergency: config.emergency})}
        >
            {config.title}
        </Label>
    );
}

import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Label} from '@gravity-ui/uikit';

import type {SelfCheckResult} from '../../types/api/healthcheck';
import {getSelfCheckView} from '../../utils/healthStatus/selfCheck';

interface HealthcheckStatusProps {
    status: SelfCheckResult;
    size?: LabelProps['size'];
}

export function HealthcheckStatus({status, size = 'm'}: HealthcheckStatusProps) {
    const {theme, icon, text} = getSelfCheckView(status);

    return (
        <Label theme={theme} icon={<Icon size={14} data={icon} />} size={size}>
            {text}
        </Label>
    );
}

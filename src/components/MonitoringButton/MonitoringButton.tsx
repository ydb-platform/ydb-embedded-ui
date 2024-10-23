import type {ButtonSize} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';

import monitoringIcon from '../../assets/icons/monitoring.svg';

interface MonitoringButtonProps {
    className?: string;
    href: string;
    size?: ButtonSize;
}

export function MonitoringButton({href, className, size = 's'}: MonitoringButtonProps) {
    return (
        <Button
            href={href}
            target="_blank"
            className={className}
            size={size}
            title="Monitoring dashboard"
        >
            <Icon data={monitoringIcon} />
        </Button>
    );
}

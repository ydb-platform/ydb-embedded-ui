import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import monitoringIcon from '../../assets/icons/monitoring.svg';

import './MonitoringButton.scss';

const b = cn('kv-monitoring-button');

interface MonitoringButtonProps {
    className?: string;
    visible?: boolean;
    href: string;
}

export function MonitoringButton({href, visible = false, className}: MonitoringButtonProps) {
    return (
        <Button
            href={href}
            target="_blank"
            className={b({visible}, className)}
            size="s"
            title="Monitoring dashboard"
        >
            <Icon data={monitoringIcon} />
        </Button>
    );
}

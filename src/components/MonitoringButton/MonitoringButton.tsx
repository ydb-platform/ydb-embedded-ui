import {Button} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {Icon} from '../Icon';

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
            <Icon name="monitoring" viewBox="0 0 16 16" width={16} height={16} />
        </Button>
    );
}

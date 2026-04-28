import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import type {ClusterLinkWithTitle} from '../../types/additionalProps';

import {headerKeyset} from './i18n';

interface ClusterMonitoringControlProps {
    link: ClusterLinkWithTitle;
}

export function ClusterMonitoringControl({link}: ClusterMonitoringControlProps) {
    return (
        <ActionTooltip title={link.description || ''} disabled={!link.description}>
            <Button view="flat" href={link.url} target="_blank">
                {link.icon && <Icon data={link.icon} />}
                {headerKeyset('title_monitoring', {system: link.title})}
            </Button>
        </ActionTooltip>
    );
}

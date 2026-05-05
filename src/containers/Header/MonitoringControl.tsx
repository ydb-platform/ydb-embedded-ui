import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import type {ClusterLinkWithTitle} from '../../types/additionalProps';

import {headerKeyset} from './i18n';

interface MonitoringControlProps {
    link: ClusterLinkWithTitle;
}

export function MonitoringControl({link}: MonitoringControlProps) {
    const description =
        link.description || headerKeyset('description_monitoring', {system: link.title});
    return (
        <ActionTooltip title={description}>
            <Button view="flat" href={link.url} target="_blank">
                {link.icon && <Icon data={link.icon} />}
                {headerKeyset('title_monitoring', {system: link.title})}
            </Button>
        </ActionTooltip>
    );
}

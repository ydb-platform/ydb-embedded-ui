import block from 'bem-cn-lite';

import type {TSystemStateInfo} from '../../../types/api/nodes';

import {InfoViewer, InfoViewerItem} from '../../InfoViewer';

import './NodeEndpointsTooltip.scss';

const b = block('ydb-node-endpoints-tooltip');

interface NodeEdpointsTooltipProps {
    data?: TSystemStateInfo;
}

export const NodeEndpointsTooltip = ({data}: NodeEdpointsTooltipProps) => {
    const info: InfoViewerItem[] = [];

    if (data?.Rack) {
        info.push({label: 'Rack', value: data.Rack});
    }

    if (data?.Endpoints && data.Endpoints.length) {
        data.Endpoints.forEach(({Name, Address}) => {
            if (Name && Address) {
                info.push({label: Name, value: Address});
            }
        });
    }

    return <InfoViewer className={b(null)} info={info} dots={false} size={'s'} />;
};

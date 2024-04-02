import type {TSystemStateInfo} from '../../../types/api/nodes';
import {cn} from '../../../utils/cn';
import type {InfoViewerItem} from '../../InfoViewer';
import {InfoViewer} from '../../InfoViewer';

import './NodeEndpointsTooltipContent.scss';

const b = cn('ydb-node-endpoints-tooltip-content');

interface NodeEdpointsTooltipProps {
    data?: TSystemStateInfo;
}

export const NodeEndpointsTooltipContent = ({data}: NodeEdpointsTooltipProps) => {
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

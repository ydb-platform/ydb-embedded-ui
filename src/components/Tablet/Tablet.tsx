import cn from 'bem-cn-lite';

import type {TTabletStateInfo} from '../../types/api/tablet';
import {getTabletLabel} from '../../utils/constants';
import routes, {createHref} from '../../routes';

import {ContentWithPopup} from '../ContentWithPopup/ContentWithPopup';
import {InternalLink} from '../InternalLink';
import {TabletTooltipContent} from '../TooltipsContent';

import './Tablet.scss';

const b = cn('tablet');

interface TabletProps {
    tablet?: TTabletStateInfo;
    tenantName?: string;
}

export const Tablet = ({tablet = {}, tenantName}: TabletProps) => {
    const {TabletId: id, NodeId} = tablet;
    const status = tablet.Overall?.toLowerCase();

    const tabletPath = id && createHref(routes.tablet, {id}, {nodeId: NodeId, tenantName});

    return (
        <ContentWithPopup
            className={b('wrapper')}
            content={<TabletTooltipContent data={tablet} className={b('popup-content')} />}
        >
            <InternalLink to={tabletPath}>
                <div className={b({status})}>
                    <div className={b('type')}>{[getTabletLabel(tablet.Type)]}</div>
                </div>
            </InternalLink>
        </ContentWithPopup>
    );
};

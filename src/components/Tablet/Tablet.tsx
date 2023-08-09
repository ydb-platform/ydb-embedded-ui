import cn from 'bem-cn-lite';

import {type TTabletStateInfo} from '../../types/api/tablet';
import {getTabletLabel} from '../../utils/constants';
import routes, {createHref} from '../../routes';

import {ContentWithPopup} from '../ContentWithPopup/ContentWithPopup';
import {TabletIcon} from '../TabletIcon/TabletIcon';
import {InternalLink} from '../InternalLink';
import {TabletTooltipContent} from '../TooltipsContent';

import './Tablet.scss';

const b = cn('tablet');

interface TabletProps {
    tablet?: TTabletStateInfo;
    tenantName?: string;
}

export const Tablet = ({tablet = {}, tenantName}: TabletProps) => {
    const {TabletId: id, NodeId, Type} = tablet;
    const status = tablet.Overall?.toLowerCase();

    const tabletPath =
        id && createHref(routes.tablet, {id}, {nodeId: NodeId, tenantName, type: Type});

    return (
        <ContentWithPopup
            className={b('wrapper')}
            content={<TabletTooltipContent data={tablet} className={b('popup-content')} />}
        >
            <InternalLink to={tabletPath}>
                <TabletIcon className={b({status})} text={getTabletLabel(tablet.Type)} />
            </InternalLink>
        </ContentWithPopup>
    );
};

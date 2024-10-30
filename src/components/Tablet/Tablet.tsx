import {getTabletPagePath} from '../../routes';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {cn} from '../../utils/cn';
import {getTabletLabel} from '../../utils/constants';
import {ContentWithPopup} from '../ContentWithPopup/ContentWithPopup';
import {InternalLink} from '../InternalLink';
import {TabletIcon} from '../TabletIcon/TabletIcon';
import {TabletTooltipContent} from '../TooltipsContent';

import './Tablet.scss';

const b = cn('tablet');

interface TabletProps {
    tablet?: TTabletStateInfo;
    database?: string;
}

export const Tablet = ({tablet = {}, database}: TabletProps) => {
    const {TabletId: id} = tablet;
    const status = tablet.Overall?.toLowerCase();

    const tabletPath = id && getTabletPagePath(id, {database});

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

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
}

export const Tablet = ({tablet = {}}: TabletProps) => {
    const {TabletId: id} = tablet;
    const status = tablet.Overall?.toLowerCase();

    return (
        <ContentWithPopup
            className={b('wrapper')}
            content={<TabletTooltipContent data={tablet} className={b('popup-content')} />}
        >
            <InternalLink to={id && createHref(routes.tablet, {id})}>
                <div className={b({status})}>
                    <div className={b('type')}>{[getTabletLabel(tablet.Type)]}</div>
                </div>
            </InternalLink>
        </ContentWithPopup>
    );
};

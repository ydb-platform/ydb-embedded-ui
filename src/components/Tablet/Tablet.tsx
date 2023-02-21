import {useRef} from 'react';
import cn from 'bem-cn-lite';

import type {TTabletStateInfo} from '../../types/api/tablet';
import type {ShowTooltipFunction} from '../../types/store/tooltip';
import {getTabletLabel} from '../../utils/constants';
import routes, {createHref} from '../../routes';

import {InternalLink} from '../InternalLink';

import './Tablet.scss';

const b = cn('tablet');

interface TabletProps {
    tablet?: TTabletStateInfo;
    onMouseEnter?: (...args: Parameters<ShowTooltipFunction>) => void;
    onMouseLeave?: VoidFunction;
}

export const Tablet = ({
    tablet = {},
    onMouseEnter = () => {},
    onMouseLeave = () => {},
}: TabletProps) => {
    const ref = useRef(null);

    const _onTabletMouseEnter = () => {
        onMouseEnter(ref.current, tablet, 'tablet');
    };

    const _onTabletClick = () => {
        const {TabletId: id} = tablet;

        if (id) {
            onMouseLeave();
        }
    };

    const {TabletId: id} = tablet;
    const status = tablet.Overall?.toLowerCase();

    return (
        <InternalLink
            onClick={_onTabletClick}
            to={id && createHref(routes.tablet, {id})}
            className={b('wrapper')}
        >
            <div
                ref={ref}
                className={b({status})}
                onMouseEnter={_onTabletMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className={b('type')}>{[getTabletLabel(tablet.Type)]}</div>
            </div>
        </InternalLink>
    );
};

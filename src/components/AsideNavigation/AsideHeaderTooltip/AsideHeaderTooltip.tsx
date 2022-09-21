import React from 'react';
import block from 'bem-cn-lite';
import {Popup, PopupPlacement} from '@gravity-ui/uikit';
import './AsideHeaderTooltip.scss';

const b = block('nv-aside-header-tooltip');
const popupPlacement: PopupPlacement = ['right'];

export interface AsideHeaderTooltipProps {
    anchor: HTMLElement | null;
    text: React.ReactNode;
}

export const AsideHeaderTooltip: React.FC<AsideHeaderTooltipProps> = ({anchor, text}) => {
    const anchorRef = React.useRef(anchor);

    React.useEffect(() => {
        anchorRef.current = anchor;
    }, [anchor]);
    if (!anchor) {
        return null;
    }

    return (
        <Popup
            className={b()}
            open={true}
            anchorRef={anchorRef}
            placement={popupPlacement}
            disableEscapeKeyDown={true}
            disableOutsideClick={true}
            disableLayer={true}
        >
            <div className={b('text')}>{text}</div>
        </Popup>
    );
};

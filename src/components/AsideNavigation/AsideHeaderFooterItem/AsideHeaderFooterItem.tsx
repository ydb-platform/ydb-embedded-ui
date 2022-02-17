import React from 'react';
import block from 'bem-cn-lite';
import {Icon, Popup, PopupPlacement, PopupProps} from '@yandex-cloud/uikit';

import {AsideHeaderTooltip} from '../AsideHeaderTooltip/AsideHeaderTooltip';
import {AsideHeaderFooterSlot, SlotName} from '../AsideHeaderFooterSlot/AsideHeaderFooterSlot';
import {ASIDE_HEADER_ICON_SIZE, FooterItemIconView} from '../constants';
import {footerItemIconMap, getFooterItemIcon} from '../icons';

import settingsIcon from '../../../assets/icons/settings.svg';

import './AsideHeaderFooterItem.scss';

const b = block('nv-aside-header-footer-item');

export const defaultAsideHeaderFooterPopupPlacement: PopupPlacement = ['right-end'];
export const defaultAsideHeaderFooterPopupOffset: NonNullable<PopupProps['offset']> = [-20, 8];

export interface AsideHeaderFooterItemProps {
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    isCompact: boolean;
    isCurrent?: boolean;
    text: React.ReactNode;
    tooltipText?: React.ReactNode;
    enableTooltip?: boolean;
    iconSize?: string | number;
    slot?: SlotName;
    view?: FooterItemIconView;
    className?: string;
    popupVisible?: boolean;
    popupAnchor?: React.RefObject<HTMLElement>;
    popupPlacement?: PopupPlacement;
    popupOffset?: PopupProps['offset'];
    renderPopupContent?: () => React.ReactNode;
    onClosePopup?: () => void;
    renderCustomIcon?: () => React.ReactNode;
}

export const AsideHeaderFooterItem: React.FC<AsideHeaderFooterItemProps> = ({
    onClick,
    isCompact,
    isCurrent = false,
    enableTooltip = true,
    tooltipText,
    text,
    iconSize = ASIDE_HEADER_ICON_SIZE,
    slot,
    view,
    className,
    popupAnchor,
    popupVisible = false,
    popupPlacement = defaultAsideHeaderFooterPopupPlacement,
    popupOffset = defaultAsideHeaderFooterPopupOffset,
    onClosePopup,
    renderPopupContent,
    renderCustomIcon,
}) => {
    const [tooltipAnchor, setTooltipAnchor] = React.useState<HTMLDivElement | null>(null);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!isCompact) {
            setTooltipAnchor(null);
        }
    }, [isCompact]);

    const icon = (slot && getFooterItemIcon(slot, view)) || settingsIcon;
    let iconPlaceNode: React.ReactNode;

    if (typeof renderCustomIcon === 'function') {
        iconPlaceNode = renderCustomIcon();
    } else {
        const iconData = typeof icon === 'string' ? footerItemIconMap[icon as never] : icon;
        iconPlaceNode = isCompact ? (
            <React.Fragment>
                <div
                    onMouseEnter={(event) => setTooltipAnchor(event.currentTarget)}
                    onMouseLeave={() => setTooltipAnchor(null)}
                    className={b('btn-icon', {current: isCurrent})}
                >
                    <Icon data={iconData} size={iconSize} className={b('icon')} />
                </div>
                {enableTooltip && (
                    <AsideHeaderTooltip anchor={tooltipAnchor} text={tooltipText || text} />
                )}
            </React.Fragment>
        ) : (
            <div className={b('icon-wrap')}>
                <Icon data={iconData} size={iconSize} className={b('icon')} />
            </div>
        );
    }

    const anchorRef = popupAnchor || ref;

    const onClose = React.useCallback(
        (event: MouseEvent | KeyboardEvent) => {
            if (
                event instanceof MouseEvent &&
                event.target &&
                ref.current?.contains(event.target as Node)
            ) {
                return;
            }
            onClosePopup?.();
        },
        [onClosePopup],
    );

    const contentNode = (
        <React.Fragment>
            <div
                className={b({compact: isCompact, current: isCurrent}, className)}
                onClick={onClick}
                ref={ref}
            >
                <div className={b('icon-place')}>{iconPlaceNode}</div>
                {!isCompact && <div className={b('text')}>{text}</div>}
            </div>
            <Popup
                className={b('popup')}
                open={popupVisible}
                placement={popupPlacement}
                offset={popupOffset}
                anchorRef={anchorRef}
                onClose={onClose}
            >
                {renderPopupContent?.()}
            </Popup>
        </React.Fragment>
    );

    return slot ? (
        <AsideHeaderFooterSlot name={slot}>{contentNode}</AsideHeaderFooterSlot>
    ) : (
        contentNode
    );
};

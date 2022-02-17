import {FooterItemIcon, FooterItemIconView} from './constants';
import {SlotName} from './AsideHeaderFooterSlot/AsideHeaderFooterSlot';

import bugIcon from '../../assets/icons/bug.svg';
import supportIcon from '../../assets/icons/support.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import settingsWithDotIcon from '../../assets/icons/settings-with-dot.svg';

export const footerItemIconMap = {
    [FooterItemIcon.Bug]: bugIcon,
    [FooterItemIcon.Support]: supportIcon,
    [FooterItemIcon.Settings]: settingsIcon,
    [FooterItemIcon.SettingsWithDot]: settingsWithDotIcon,
};

export function getFooterItemIcon(slot: SlotName, view?: FooterItemIconView) {
    switch (slot) {
        case SlotName.BugReport:
            return footerItemIconMap[FooterItemIcon.Bug];
        case SlotName.Support:
            return footerItemIconMap[FooterItemIcon.Support];
        case SlotName.Settings:
            switch (view) {
                case FooterItemIconView.WithDot:
                    return footerItemIconMap[FooterItemIcon.SettingsWithDot];
                default:
                    return footerItemIconMap[FooterItemIcon.Settings];
            }
        default:
            return undefined;
    }
}

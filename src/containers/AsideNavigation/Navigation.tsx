import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';
import {UserSettings} from '../UserSettings/UserSettings';

import {useNavigationMenuItems} from './useNavigationMenuItems';
import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';

import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

interface NavigationProps {
    userSettings?: YDBEmbeddedUISettings;
    children: React.ReactNode;
}
export function Navigation({children, userSettings}: NavigationProps) {
    const AsideNavigation = useComponent('AsideNavigation');

    const menuItems = useNavigationMenuItems();

    return (
        <AsideNavigation
            settings={<UserSettings settings={userSettings} />}
            menuItems={menuItems}
            ydbInternalUser={<YdbInternalUser />}
            content={children}
        />
    );
}

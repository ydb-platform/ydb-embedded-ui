import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import {UserSettings} from '../UserSettings/UserSettings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';
import {useNavigationMenuItems} from './useNavigationMenuItems';

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

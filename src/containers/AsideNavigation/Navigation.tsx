import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import {UserSettings} from '../UserSettings/UserSettings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';

interface NavigationProps {
    userSettings?: YDBEmbeddedUISettings;
    children: React.ReactNode;
}
export function Navigation({children, userSettings}: NavigationProps) {
    const AsideNavigation = useComponent('AsideNavigation');

    return (
        <AsideNavigation
            settings={<UserSettings settings={userSettings} />}
            ydbInternalUser={<YdbInternalUser />}
            content={children}
        />
    );
}

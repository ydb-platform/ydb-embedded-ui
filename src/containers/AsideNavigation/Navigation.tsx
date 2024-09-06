import {useComponent} from '../../components/ComponentsProvider/ComponentsProvider';
import {selectUser} from '../../store/reducers/authentication/authentication';
import {useTypedSelector} from '../../utils/hooks';
import {UserSettings} from '../UserSettings/UserSettings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {YdbInternalUser} from './YdbInternalUser/YdbInternalUser';

interface NavigationProps {
    userSettings: YDBEmbeddedUISettings;
    children: React.ReactNode;
}
export function Navigation({children, userSettings}: NavigationProps) {
    const AsideNavigation = useComponent('AsideNavigation');

    const ydbUser = useTypedSelector(selectUser);

    return (
        <AsideNavigation
            settings={<UserSettings settings={userSettings} />}
            ydbInternalUser={<YdbInternalUser login={ydbUser} />}
            user={ydbUser ? {login: ydbUser} : undefined}
            content={children}
        />
    );
}

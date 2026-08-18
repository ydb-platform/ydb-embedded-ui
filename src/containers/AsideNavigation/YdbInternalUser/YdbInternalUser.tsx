import {ArrowRightFromSquare, ArrowRightToSquare} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import routes, {createHref} from '../../../routes';
import {authenticationApi} from '../../../store/reducers/authentication/authentication';
import {useClusterWithoutAuthInUI} from '../../../store/reducers/capabilities/hooks';
import {cn} from '../../../utils/cn';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {useMetaAuth, useMetaAuthUnavailable} from '../../../utils/hooks/useMetaAuth';
import type {UserInfo} from '../../../utils/user';
import i18n from '../i18n';

import './YdbInternalUser.scss';

const b = cn('kv-ydb-internal-user');

export function YdbInternalUser({user}: {user?: UserInfo}) {
    const [logout] = authenticationApi.useLogoutMutation();
    const authUnavailable = useClusterWithoutAuthInUI();
    const metaAuthUnavailable = useMetaAuthUnavailable();
    const metaAuth = useMetaAuth();
    const database = useDatabaseFromQuery();

    const history = useHistory();
    const handleLoginClick = () => {
        history.push(
            createHref(routes.auth, undefined, {
                returnUrl: encodeURIComponent(location.href),
                database,
            }),
        );
    };

    const handleLogout = () => {
        logout({useMeta: metaAuth});
    };

    const renderLoginButton = () => {
        if (authUnavailable || metaAuthUnavailable) {
            return null;
        }
        return (
            <ActionTooltip title={i18n('account.login')}>
                <Button
                    view="flat-secondary"
                    onClick={handleLoginClick}
                    aria-label={i18n('account.login')}
                >
                    <Icon data={ArrowRightToSquare} />
                </Button>
            </ActionTooltip>
        );
    };

    return (
        <div className={b()}>
            <div className={b('user-info-wrapper')}>
                <div className={b('ydb-internal-user-title')}>
                    {user?.isSso ? user.login : i18n('account.user')}
                </div>
                {user && (
                    <div className={b('username')}>
                        {user.isSso ? i18n('account.sso-authorised') : user.login}
                    </div>
                )}
            </div>
            {user ? (
                <ActionTooltip title={i18n('account.logout')}>
                    <Button
                        view="flat-secondary"
                        onClick={handleLogout}
                        aria-label={i18n('account.logout')}
                    >
                        <Icon data={ArrowRightFromSquare} />
                    </Button>
                </ActionTooltip>
            ) : (
                renderLoginButton()
            )}
        </div>
    );
}

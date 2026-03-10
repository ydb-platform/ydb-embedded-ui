import {ArrowRightFromSquare, ArrowRightToSquare} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import routes, {createHref} from '../../../routes';
import {authenticationApi} from '../../../store/reducers/authentication/authentication';
import {useClusterWithoutAuthInUI} from '../../../store/reducers/capabilities/hooks';
import {cn} from '../../../utils/cn';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {useMetaAuth, useMetaAuthUnavailable} from '../../../utils/hooks/useMetaAuth';
import i18n from '../i18n';

import './YdbInternalUser.scss';

const b = cn('kv-ydb-internal-user');

export function YdbInternalUser({login}: {login?: string}) {
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
                <div className={b('ydb-internal-user-title')}>{i18n('account.user')}</div>
                {login && <div className={b('username')}>{login}</div>}
            </div>
            {login ? (
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

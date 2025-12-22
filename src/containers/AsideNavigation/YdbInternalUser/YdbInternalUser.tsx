import {ArrowRightFromSquare, ArrowRightToSquare} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
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
            <Button view="flat-secondary" title={i18n('account.login')} onClick={handleLoginClick}>
                <Icon data={ArrowRightToSquare} />
            </Button>
        );
    };

    return (
        <div className={b()}>
            <div className={b('user-info-wrapper')}>
                <div className={b('ydb-internal-user-title')}>{i18n('account.user')}</div>
                {login && <div className={b('username')}>{login}</div>}
            </div>
            {login ? (
                <Button view="flat-secondary" title={i18n('account.logout')} onClick={handleLogout}>
                    <Icon data={ArrowRightFromSquare} />
                </Button>
            ) : (
                renderLoginButton()
            )}
        </div>
    );
}

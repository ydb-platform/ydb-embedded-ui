import {ArrowRightFromSquare, ArrowRightToSquare} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import {useHistory} from 'react-router';

import routes, {createHref} from '../../../routes';
import {logout} from '../../../store/reducers/authentication/authentication';
import {cn} from '../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import i18n from '../i18n';

import './YdbInternalUser.scss';

const b = cn('kv-ydb-internal-user');

export function YdbInternalUser() {
    const {user: ydbUser} = useTypedSelector((state) => state.authentication);

    const history = useHistory();
    const handleLoginClick = () => {
        history.push(
            createHref(routes.auth, undefined, {returnUrl: encodeURIComponent(location.href)}),
        );
    };

    const dispatch = useTypedDispatch();
    const handleLogout = () => {
        dispatch(logout);
    };

    return (
        <div className={b()}>
            <div className={b('user-info-wrapper')}>
                <div className={b('ydb-internal-user-title')}>{i18n('account.user')}</div>
                {ydbUser && <div className={b('username')}>{ydbUser}</div>}
            </div>
            {ydbUser ? (
                <Button view="flat-secondary" title={i18n('account.logout')} onClick={handleLogout}>
                    <Icon data={ArrowRightFromSquare} />
                </Button>
            ) : (
                <Button
                    view="flat-secondary"
                    title={i18n('account.login')}
                    onClick={handleLoginClick}
                >
                    <Icon data={ArrowRightToSquare} />
                </Button>
            )}
        </div>
    );
}

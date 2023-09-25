import {KeyboardEvent, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {useHistory, useLocation} from 'react-router';
import cn from 'bem-cn-lite';

import {Button, TextInput, Icon, Link as ExternalLink} from '@gravity-ui/uikit';

import {authenticate} from '../../store/reducers/authentication/authentication';
import {useTypedSelector} from '../../utils/hooks';
import {parseQuery} from '../../routes';

import ydbLogoIcon from '../../assets/icons/ydb.svg';
import showIcon from '../../assets/icons/show.svg';
import hideIcon from '../../assets/icons/hide.svg';
import closeIcon from '../../assets/icons/close.svg';

import './Authentication.scss';

const b = cn('authentication');

interface AuthenticationProps {
    closable?: boolean;
}

function Authentication({closable = false}: AuthenticationProps) {
    const dispatch = useDispatch();
    const history = useHistory();
    const location = useLocation();

    const {returnUrl} = parseQuery(location);

    const {error} = useTypedSelector((state) => state.authentication);

    const [login, setLogin] = useState('');
    const [pass, setPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (error?.data?.error?.includes('user')) {
            setLoginError(error.data.error);
        }
        if (error?.data?.error?.includes('password')) {
            setPasswordError(error.data.error);
        }
    }, [error]);

    const onLoginUpdate = (value: string) => {
        setLogin(value);
        setLoginError('');
    };

    const onPassUpdate = (value: string) => {
        setPass(value);
        setPasswordError('');
    };

    const onLoginClick = () => {
        // @ts-expect-error
        // typed dispatch required, remove error expectation after adding it
        dispatch(authenticate(login, pass)).then(() => {
            if (returnUrl) {
                const decodedUrl = decodeURIComponent(returnUrl.toString());

                // to prevent page reload we use router history
                // history navigates relative to origin
                // so we remove origin to make it work properly
                const url = new URL(decodedUrl);
                const path = url.pathname + url.search;
                history.replace(path);
            }
        });
    };

    const onEnterClick = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.keyCode === 13) {
            onLoginClick();
        }
    };

    const onClose = () => {
        history.go(-1);
    };

    const onTogglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <section className={b()}>
            <form className={b('form-wrapper')}>
                <div className={b('header')}>
                    <div className={b('logo')}>
                        <Icon data={ydbLogoIcon} size={24} />
                        YDB
                    </div>
                    <ExternalLink href="http://ydb.tech/docs" target="_blank">
                        Documentation
                    </ExternalLink>
                </div>
                <h2 className={b('title')}>Sign in</h2>
                <div className={b('field-wrapper')}>
                    <TextInput
                        value={login}
                        onUpdate={onLoginUpdate}
                        placeholder={'Username'}
                        error={loginError}
                        onKeyDown={onEnterClick}
                        size="l"
                        autoFocus
                    />
                </div>
                <div className={b('field-wrapper')}>
                    <TextInput
                        value={pass}
                        onUpdate={onPassUpdate}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={'Password'}
                        error={passwordError}
                        onKeyDown={onEnterClick}
                        size="l"
                    />
                    <Button
                        onClick={onTogglePasswordVisibility}
                        size="l"
                        className={b('show-password-button')}
                    >
                        <Icon data={showPassword ? hideIcon : showIcon} size={16} />
                    </Button>
                </div>
                <Button
                    view="action"
                    onClick={onLoginClick}
                    width="max"
                    size="l"
                    disabled={Boolean(!login || loginError || passwordError)}
                    className={b('button-sign-in')}
                >
                    Sign in
                </Button>
            </form>
            {closable && history.length > 1 && (
                <Button onClick={onClose} className={b('close')}>
                    <Icon data={closeIcon} size={24} />
                </Button>
            )}
        </section>
    );
}

export default Authentication;

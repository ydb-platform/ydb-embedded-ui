import {KeyboardEvent, useEffect, useState} from 'react';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Button, TextInput, Icon, Link as ExternalLink} from '@yandex-cloud/uikit';
//@ts-ignore
import {authenticate} from '../../store/reducers/authentication';

import ydbLogoIcon from '../../assets/icons/ydb.svg';
import showIcon from '../../assets/icons/show.svg';
import hideIcon from '../../assets/icons/hide.svg';

import './Authentication.scss';

const b = cn('authentication');

function Authentication({authenticate, error}: any) {
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
        authenticate(login, pass);
    };

    const onEnterClick = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            onLoginClick();
        }
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
        </section>
    );
}

function mapStateToProps(state: any) {
    return {
        error: state.authentication.error,
    };
}

const mapDispatchToProps = {
    authenticate,
};

export default connect(mapStateToProps, mapDispatchToProps)(Authentication);

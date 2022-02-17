import {KeyboardEvent, useEffect, useState} from 'react';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Button, TextInput} from '@yandex-cloud/uikit';
//@ts-ignore
import {authenticate} from '../../store/reducers/authentication';

import './Authentication.scss';

const b = cn('authentication');

function Authentication({authenticate, error}: any) {
    const [login, setLogin] = useState('');
    const [pass, setPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [passwordError, setPasswordError] = useState('');

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

    return (
        <section className={b()}>
            <div className={b('form-wrapper')}>
                <h2>Please sign in:</h2>
                <div className={b('field-wrapper')}>
                    <TextInput
                        value={login}
                        onUpdate={onLoginUpdate}
                        placeholder={'Username'}
                        error={loginError}
                    />
                </div>
                <div className={b('field-wrapper')}>
                    <TextInput
                        value={pass}
                        onUpdate={onPassUpdate}
                        type="password"
                        placeholder={'Password'}
                        error={passwordError}
                        onKeyDown={onEnterClick}
                    />
                </div>
                <div className={b('field-wrapper')}>
                    <Button view="action" onClick={onLoginClick} width="max">
                        Let me in!
                    </Button>
                </div>
            </div>
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

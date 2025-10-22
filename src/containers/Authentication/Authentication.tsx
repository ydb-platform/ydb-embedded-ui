import React from 'react';

import {Eye, EyeSlash, Xmark} from '@gravity-ui/icons';
import {Button, Link as ExternalLink, Icon, TextInput} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';

import {checkIsClustersPage, parseQuery} from '../../routes';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import {useLoginWithDatabase, useMetaLoginAvailable} from '../../store/reducers/capabilities/hooks';
import {cn} from '../../utils/cn';

import {isDatabaseError, isPasswordError, isUserError} from './utils';

import ydbLogoIcon from '../../assets/icons/ydb.svg';

import './Authentication.scss';

const b = cn('authentication');

interface AuthenticationProps {
    closable?: boolean;
}

function Authentication({closable = false}: AuthenticationProps) {
    const history = useHistory();
    const location = useLocation();

    const needDatabase = useLoginWithDatabase();

    const isClustersPage = checkIsClustersPage(location.pathname);
    const isMetaLoginAvailable = useMetaLoginAvailable();

    const [authenticate, {isLoading}] = authenticationApi.useAuthenticateMutation();

    const {returnUrl, database: databaseFromQuery} = parseQuery(location);

    const [login, setLogin] = React.useState('');
    const [database, setDatabase] = React.useState(databaseFromQuery?.toString() ?? '');
    const [password, setPass] = React.useState('');
    const [loginError, setLoginError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const [databaseError, setDatabaseError] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const onLoginUpdate = (value: string) => {
        setLogin(value);
        setLoginError('');
    };
    const onDatabaseUpdate = (value: string) => {
        setDatabase(value);
        setDatabaseError('');
    };

    const onPassUpdate = (value: string) => {
        setPass(value);
        setPasswordError('');
    };

    const useMeta = isClustersPage && isMetaLoginAvailable;

    const onLoginClick = () => {
        authenticate({user: login, password, database, useMeta})
            .unwrap()
            .then(() => {
                if (returnUrl) {
                    const decodedUrl = decodeURIComponent(returnUrl.toString());

                    // to prevent page reload we use router history
                    // history navigates relative to origin
                    // so we remove origin to make it work properly
                    const url = new URL(decodedUrl);
                    const path = url.pathname + url.search;
                    history.replace(path);
                }
            })
            .catch((error) => {
                if (isUserError(error)) {
                    setLoginError(error.data.error);
                }
                if (isPasswordError(error)) {
                    setPasswordError(error.data.error);
                }
                if (isDatabaseError(error)) {
                    setDatabaseError(error.data.error);
                }
            });
    };

    const onEnterClick = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                    <ExternalLink href="https://ydb.tech/docs" target="_blank">
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
                        value={password}
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
                        <Icon data={showPassword ? EyeSlash : Eye} size={16} />
                    </Button>
                </div>
                {needDatabase && (
                    <div className={b('field-wrapper')}>
                        <TextInput
                            value={database}
                            onUpdate={onDatabaseUpdate}
                            placeholder={'Database'}
                            error={databaseError}
                            onKeyDown={onEnterClick}
                            size="l"
                        />
                    </div>
                )}
                <Button
                    view="action"
                    onClick={onLoginClick}
                    width="max"
                    size="l"
                    disabled={Boolean(!login || loginError || passwordError)}
                    loading={isLoading}
                    className={b('button-sign-in')}
                >
                    Sign in
                </Button>
            </form>
            {closable && history.length > 1 && (
                <Button onClick={onClose} className={b('close')}>
                    <Icon data={Xmark} size={24} />
                </Button>
            )}
        </section>
    );
}

export default Authentication;

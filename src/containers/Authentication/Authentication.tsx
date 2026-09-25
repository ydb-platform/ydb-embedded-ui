import React from 'react';

import {Eye, EyeSlash, Xmark} from '@gravity-ui/icons';
import {ActionTooltip, Button, Link as ExternalLink, Icon, TextInput} from '@gravity-ui/uikit';
import {useHistory, useLocation, useRouteMatch} from 'react-router-dom';

import routes, {getClusterPath, getHomePagePath, parseQuery} from '../../routes';
import {basename} from '../../store';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import {useLoginWithDatabase, useOidcAvailable} from '../../store/reducers/capabilities/hooks';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../utils/constants';
import {prepareCommonErrorMessage} from '../../utils/errors';
import {useMetaAuth} from '../../utils/hooks/useMetaAuth';
import {useTypedSelector} from '../../utils/hooks/useTypedSelector';

import i18n from './i18n';
import {
    createSsoAuthorizeUrl,
    getAuthReturnTo,
    isDatabaseError,
    isPasswordError,
    isUserError,
} from './utils';

import ydbLogoIcon from '../../assets/icons/ydb.svg';

import './Authentication.scss';

const b = cn('authentication');

interface AuthenticationProps {
    closable?: boolean;
}

function Authentication({closable = false}: AuthenticationProps) {
    const history = useHistory();
    const location = useLocation();
    const isDirectAuthPage = Boolean(useRouteMatch({path: routes.auth, exact: true}));
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const needDatabase = useLoginWithDatabase();
    const oidcAvailable = useOidcAvailable();

    const [authenticate, {isLoading}] = authenticationApi.useAuthenticateMutation();

    const {returnUrl, database: databaseFromQuery} = parseQuery(location);
    const currentHref = window.location.href;

    const returnTo = React.useMemo(() => {
        const fallbackPath = singleClusterMode
            ? getClusterPath(undefined, undefined, {withBasename: true})
            : getHomePagePath(undefined, undefined, {withBasename: true});

        return getAuthReturnTo({
            currentUrl: new URL(currentHref),
            fallbackPath,
            isDirectAuthPage,
            returnUrl,
        });
    }, [currentHref, isDirectAuthPage, returnUrl, singleClusterMode]);

    const pathname = new URL(returnTo, currentHref).pathname;
    // Route matching for meta authentication expects a pathname without the router basename.
    const authPath =
        basename && pathname.startsWith(`${basename}/`)
            ? pathname.slice(basename.length)
            : pathname;
    const useMeta = useMetaAuth(authPath);

    const ssoUrl = React.useMemo(() => {
        if (!oidcAvailable) {
            return undefined;
        }

        const currentUrl = new URL(currentHref);
        const ssoReturnTo = getAuthReturnTo({
            currentUrl,
            fallbackPath: getHomePagePath(undefined, undefined, {withBasename: true}),
            isDirectAuthPage,
            returnUrl,
        });
        return createSsoAuthorizeUrl(currentUrl.host, ssoReturnTo);
    }, [currentHref, isDirectAuthPage, oidcAvailable, returnUrl]);

    const [login, setLogin] = React.useState('');
    const [database, setDatabase] = React.useState(databaseFromQuery?.toString() || undefined);
    const [password, setPass] = React.useState('');
    const [loginError, setLoginError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const [databaseError, setDatabaseError] = React.useState('');
    const [generalError, setGeneralError] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const onLoginUpdate = (value: string) => {
        setLogin(value);
        setLoginError('');
        setGeneralError('');
    };
    const onDatabaseUpdate = (value: string) => {
        setDatabase(value);
        setDatabaseError('');
        setGeneralError('');
    };

    const onPassUpdate = (value: string) => {
        setPass(value);
        setPasswordError('');
        setGeneralError('');
    };

    const onLoginClick = () => {
        setGeneralError('');
        authenticate({user: login, password, database, useMeta})
            .unwrap()
            .then(() => {
                if (isDirectAuthPage) {
                    window.location.replace(returnTo);
                } else {
                    window.location.reload();
                }
            })
            .catch((error) => {
                const isInputError =
                    isUserError(error) || isPasswordError(error) || isDatabaseError(error);
                if (isUserError(error)) {
                    setLoginError(error.data.error);
                }
                if (isPasswordError(error)) {
                    setPasswordError(error.data.error);
                }
                if (isDatabaseError(error)) {
                    setDatabaseError(error.data.error);
                }

                if (!isInputError) {
                    const message = prepareCommonErrorMessage(
                        error,
                        i18n('description_default-error'),
                    );
                    setGeneralError(message);
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
    const passwordButtonTitle = showPassword
        ? i18n('action_hide-password')
        : i18n('action_show-password');
    const closeButtonTitle = i18n('action_close');
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
                    <ActionTooltip title={passwordButtonTitle}>
                        <Button
                            onClick={onTogglePasswordVisibility}
                            size="l"
                            className={b('show-password-button')}
                            aria-label={passwordButtonTitle}
                        >
                            <Icon data={showPassword ? EyeSlash : Eye} size={16} />
                        </Button>
                    </ActionTooltip>
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
                    className={b('button-sign-in', undefined, BRAND_BUTTON_CLASS)}
                >
                    Sign in
                </Button>
                {ssoUrl && (
                    <Button
                        view="outlined"
                        href={ssoUrl}
                        width="max"
                        size="l"
                        className={b('button-sso')}
                    >
                        {i18n('action_via-sso')}
                    </Button>
                )}
                {/* always preserve place for general error to prevent container height jumping */}
                <div className={b('general-error')}>{generalError}</div>
            </form>
            {closable && history.length > 1 && (
                <ActionTooltip title={closeButtonTitle}>
                    <Button onClick={onClose} className={b('close')} aria-label={closeButtonTitle}>
                        <Icon data={Xmark} size={24} />
                    </Button>
                </ActionTooltip>
            )}
        </section>
    );
}

export default Authentication;

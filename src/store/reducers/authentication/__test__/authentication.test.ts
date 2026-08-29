import type {AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {AxiosError} from 'axios';

import {YdbEmbeddedAPI} from '../../../../services/api';
import {configureUIFactory} from '../../../../uiFactory/uiFactory';
import {configureStore as configureAppStore} from '../../../configureStore';
import {authenticationApi} from '../authentication';

function createUnauthorizedAdapter(data: unknown): AxiosAdapter {
    return async (config: InternalAxiosRequestConfig) => {
        const response: AxiosResponse = {
            data,
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
        };

        throw new AxiosError(
            'Request failed with status code 401',
            AxiosError.ERR_BAD_REQUEST,
            config,
            undefined,
            response,
        );
    };
}

describe('configureStore authentication notifications', () => {
    afterEach(() => {
        configureUIFactory({enableOidcAuthenticationChoice: false});
    });

    test('preserves automatic OIDC redirect by default', () => {
        let onUnauthenticated: (() => void) | undefined;
        const embeddedApi = {
            setOnUnauthenticated: (handler: () => void) => {
                onUnauthenticated = handler;
            },
        };
        const {store} = configureAppStore({api: embeddedApi as never});

        expect(onUnauthenticated).toBeUndefined();
        expect(store.getState().authentication.isAuthenticated).toBe(true);
    });

    test('sets unauthenticated state when OIDC authentication choice is enabled', () => {
        let onUnauthenticated: (() => void) | undefined;
        const embeddedApi = {
            setOnUnauthenticated: (handler: () => void) => {
                onUnauthenticated = handler;
            },
        };
        configureUIFactory({enableOidcAuthenticationChoice: true});
        const {store} = configureAppStore({api: embeddedApi as never});

        onUnauthenticated?.();

        expect(store.getState().authentication.isAuthenticated).toBe(false);
    });

    test.each([
        {
            title: 'a plain whoami 401 response',
            responseData: {},
            enableOidcAuthenticationChoice: false,
        },
        {
            title: 'a whoami authUrl response when the OIDC choice is enabled',
            responseData: {authUrl: 'https://auth.example.com/login'},
            enableOidcAuthenticationChoice: true,
        },
    ])('opens the Authentication page for $title', async (testCase) => {
        const originalChecksSetting = window.react_app_disable_checks;
        window.react_app_disable_checks = true;
        try {
            const api = new YdbEmbeddedAPI({
                webVersion: false,
                withCredentials: false,
                singleClusterMode: true,
                proxyMeta: false,
                useRelativePath: false,
                useMetaSettings: false,
                csrfTokenGetter: undefined,
                defaults: {adapter: createUnauthorizedAdapter(testCase.responseData)},
            });
            configureUIFactory({
                enableOidcAuthenticationChoice: testCase.enableOidcAuthenticationChoice,
            });
            const {store} = configureAppStore({api});

            await store.dispatch(
                authenticationApi.endpoints.whoami.initiate(
                    {database: '/Root', useMeta: false},
                    {subscribe: false},
                ),
            );

            expect(store.getState().authentication.isAuthenticated).toBe(false);
        } finally {
            window.react_app_disable_checks = originalChecksSetting;
        }
    });
});

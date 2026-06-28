import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import type {AxiosRequestConfig} from 'axios';

import {codeAssistBackend} from '../../store';

import {AuthAPI} from './auth';
import type {CsrfTokenGetter} from './base';
import {getCsrfTokenFromCookie} from './base';
import {CodeAssistAPI} from './codeAssist';
import {MetaAPI} from './meta';
import {MetaSettingsAPI} from './metaSettings';
import {OperationAPI} from './operation';
import {PDiskAPI} from './pdisk';
import {SchemeAPI} from './scheme';
import {StorageAPI} from './storage';
import {StreamingAPI} from './streaming';
import {TabletsAPI} from './tablets';
import {VDiskAPI} from './vdisk';
import {ViewerAPI} from './viewer';

// Require all fields to be explicitly passed
// It is needed to prevent forgotten params in installations
// Where ydb-embedded-ui is used as a package
interface YdbEmbeddedAPIProps {
    webVersion: undefined | boolean;
    withCredentials: undefined | boolean;
    singleClusterMode: undefined | boolean;
    proxyMeta: undefined | boolean;
    // this setting allows to use schema object path relative to database in api requests
    useRelativePath: undefined | boolean;
    useMetaSettings: undefined | boolean;
    csrfTokenGetter: undefined | CsrfTokenGetter;
    defaults: undefined | AxiosRequestConfig;
}

export class YdbEmbeddedAPI {
    auth: AuthAPI;
    operation: OperationAPI;
    pdisk: PDiskAPI;
    scheme: SchemeAPI;
    storage: StorageAPI;
    streaming: StreamingAPI;
    tablets: TabletsAPI;
    vdisk: VDiskAPI;
    viewer: ViewerAPI;

    meta?: MetaAPI;
    metaSettings?: MetaSettingsAPI;
    codeAssist?: CodeAssistAPI;

    constructor({
        webVersion = false,
        withCredentials = false,
        singleClusterMode = true,
        proxyMeta = false,
        csrfTokenGetter = getCsrfTokenFromCookie,
        defaults = {},
        useRelativePath = false,
        useMetaSettings = false,
    }: YdbEmbeddedAPIProps) {
        const axiosParams: AxiosWrapperOptions = {
            config: {
                withCredentials,
                ...defaults,
                transitional: {
                    ...defaults?.transitional,
                    clarifyTimeoutError: true,
                },
            },
        };
        const baseApiParams = {singleClusterMode, proxyMeta, useRelativePath, csrfTokenGetter};

        this.auth = new AuthAPI(axiosParams, baseApiParams);
        if (webVersion) {
            this.meta = new MetaAPI(axiosParams, baseApiParams);
        }
        if (useMetaSettings) {
            this.metaSettings = new MetaSettingsAPI(axiosParams, baseApiParams);
        }

        if (webVersion || codeAssistBackend) {
            this.codeAssist = new CodeAssistAPI(axiosParams, baseApiParams);
        }

        this.operation = new OperationAPI(axiosParams, baseApiParams);
        this.pdisk = new PDiskAPI(axiosParams, baseApiParams);
        this.scheme = new SchemeAPI(axiosParams, baseApiParams);
        this.storage = new StorageAPI(axiosParams, baseApiParams);
        this.streaming = new StreamingAPI(axiosParams, baseApiParams);
        this.tablets = new TabletsAPI(axiosParams, baseApiParams);
        this.vdisk = new VDiskAPI(axiosParams, baseApiParams);
        this.viewer = new ViewerAPI(axiosParams, baseApiParams);
    }
}

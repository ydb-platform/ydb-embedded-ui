import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import type {AxiosRequestConfig} from 'axios';

import {codeAssistBackend} from '../../store';

import {AuthAPI} from './auth';
import {CodeAssistAPI} from './codeAssist';
import {MetaAPI} from './meta';
import {OperationAPI} from './operation';
import {PDiskAPI} from './pdisk';
import {SchemeAPI} from './scheme';
import {StorageAPI} from './storage';
import {StreamingAPI} from './streaming';
import {TabletsAPI} from './tablets';
import {VDiskAPI} from './vdisk';
import {ViewerAPI} from './viewer';

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
    codeAssist?: CodeAssistAPI;

    constructor({
        webVersion = false,
        withCredentials = false,
        singleClusterMode,
        csrfTokenGetter = () => undefined,
        defaults = {},
    }: {
        webVersion?: boolean;
        withCredentials?: boolean;
        singleClusterMode?: boolean;
        csrfTokenGetter?: () => string | undefined;
        defaults?: AxiosRequestConfig;
    } = {}) {
        const axiosParams: AxiosWrapperOptions = {config: {withCredentials, ...defaults}};
        const baseApiParams = {singleClusterMode};

        this.auth = new AuthAPI(axiosParams, baseApiParams);
        if (webVersion) {
            this.meta = new MetaAPI(axiosParams, baseApiParams);
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

        const token = csrfTokenGetter();
        if (token) {
            this.auth.setCSRFToken(token);
            // Use optional chaining as `meta` may not be initialized.
            this.meta?.setCSRFToken(token);
            // Use optional chaining as `codeAssist` may not be initialized.
            this.codeAssist?.setCSRFToken(token);
            this.operation.setCSRFToken(token);
            this.pdisk.setCSRFToken(token);
            this.scheme.setCSRFToken(token);
            this.storage.setCSRFToken(token);
            this.streaming.setCSRFToken(token);
            this.tablets.setCSRFToken(token);
            this.vdisk.setCSRFToken(token);
            this.viewer.setCSRFToken(token);
        }
    }
}

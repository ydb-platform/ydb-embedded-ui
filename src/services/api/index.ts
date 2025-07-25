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
        csrfTokenGetter = () => undefined,
        defaults = {},
    }: {
        webVersion?: boolean;
        withCredentials?: boolean;
        csrfTokenGetter?: () => string | undefined;
        defaults?: AxiosRequestConfig;
    } = {}) {
        const config: AxiosRequestConfig = {withCredentials, ...defaults};

        this.auth = new AuthAPI({config});
        if (webVersion) {
            this.meta = new MetaAPI({config});
        }

        if (webVersion || codeAssistBackend) {
            this.codeAssist = new CodeAssistAPI({config});
        }

        this.operation = new OperationAPI({config});
        this.pdisk = new PDiskAPI({config});
        this.scheme = new SchemeAPI({config});
        this.storage = new StorageAPI({config});
        this.streaming = new StreamingAPI({config});
        this.tablets = new TabletsAPI({config});
        this.vdisk = new VDiskAPI({config});
        this.viewer = new ViewerAPI({config});

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

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

    constructor({webVersion = false, withCredentials = false} = {}) {
        const config: AxiosRequestConfig = {withCredentials};

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
    }
}

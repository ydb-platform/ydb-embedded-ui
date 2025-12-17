import type {
    GetSettingResponse,
    GetSettingsParams,
    GetSingleSettingParams,
    SetSettingResponse,
    SetSingleSettingParams,
    Setting,
} from '../../types/api/settings';

import {BaseMetaAPI} from './baseMeta';

interface PendingRequest {
    resolve: (value: Setting) => void;
    reject: (error: unknown) => void;
}

function joinBaseUrlAndPath(baseUrl: string, path: string) {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
}

export class MetaSettingsAPI extends BaseMetaAPI {
    private batchTimeout: NodeJS.Timeout | undefined = undefined;
    private currentUser: string | undefined = undefined;
    private requestQueue: Map<string, PendingRequest[]> | undefined = undefined;
    private baseUrlOverride: string | undefined;

    setBaseUrlOverride(baseUrlOverride: string | undefined) {
        this.baseUrlOverride = baseUrlOverride;
    }

    getPath(path: string, clusterName?: string) {
        if (this.baseUrlOverride) {
            return joinBaseUrlAndPath(this.baseUrlOverride, path);
        }
        return super.getPath(path, clusterName);
    }

    getSingleSetting({
        name,
        user,
        preventBatching,
    }: GetSingleSettingParams & {preventBatching?: boolean}) {
        if (preventBatching) {
            return this.get<Setting | undefined>(this.getPath('/meta/user_settings'), {name, user});
        }

        return new Promise<Setting>((resolve, reject) => {
            // Always request settings for current user
            this.currentUser = user;

            if (!this.requestQueue) {
                this.initBatch();
            }

            if (!this.requestQueue?.has(name)) {
                this.requestQueue?.set(name, []);
            }

            this.requestQueue?.get(name)?.push({
                resolve,
                reject,
            });
        });
    }

    setSingleSetting(params: SetSingleSettingParams) {
        return this.post<SetSettingResponse>(this.getPath('/meta/user_settings'), params, {});
    }
    getSettings(params: GetSettingsParams) {
        return this.post<GetSettingResponse>(this.getPath('/meta/get_user_settings'), params, {});
    }

    private initBatch() {
        this.requestQueue = new Map();
        this.batchTimeout = setTimeout(() => {
            this.flushBatch();
        }, 100);
    }

    private flushBatch() {
        if (!this.requestQueue || !this.requestQueue.size || !this.currentUser) {
            return;
        }

        const batch = this.requestQueue;
        const user = this.currentUser;
        clearTimeout(this.batchTimeout);
        this.requestQueue = undefined;
        this.batchTimeout = undefined;

        const settingNames = Array.from(batch.keys());

        this.getSettings({user, name: settingNames})
            .then((response) => {
                batch.forEach((pendingRequests, name) => {
                    const settingResult = response[name];
                    if (settingResult) {
                        pendingRequests.forEach((request) => {
                            request.resolve(settingResult);
                        });
                    } else {
                        pendingRequests.forEach((request) => {
                            request.resolve({value: undefined});
                        });
                    }
                });
            })
            .catch((error) => {
                batch.forEach((pendingRequests) => {
                    pendingRequests.forEach((request) => {
                        request.reject(error);
                    });
                });
            });
    }
}

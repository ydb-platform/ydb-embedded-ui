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

export class MetaSettingsAPI extends BaseMetaAPI {
    private batchTimeout: NodeJS.Timeout | undefined = undefined;
    private currentUser: string | undefined = undefined;
    private requestQueue: Map<string, PendingRequest[]> | undefined = undefined;

    getSingleSetting({
        name,
        user,
        preventBatching,
    }: GetSingleSettingParams & {preventBatching?: boolean}) {
        if (preventBatching) {
            return this.get<Setting>(this.getPath('/meta/user_settings'), {name, user});
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
        this.requestQueue = undefined;
        clearTimeout(this.batchTimeout);

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
                            request.resolve({name, user, value: undefined});
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

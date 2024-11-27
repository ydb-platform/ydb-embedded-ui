import type {TTabletHiveResponse} from '../../types/api/tablet';
import type {Nullable} from '../../utils/typecheckers';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class TabletsAPI extends BaseYdbAPI {
    evictVDiskOld({
        groupId,
        groupGeneration,
        failRealmIdx,
        failDomainIdx,
        vDiskIdx,
    }: {
        groupId: string | number;
        groupGeneration: string | number;
        failRealmIdx: string | number;
        failDomainIdx: string | number;
        vDiskIdx: string | number;
        force?: boolean;
    }) {
        // BSC Id is constant for all ydb clusters
        const BSC_TABLET_ID = '72057594037932033';

        return this.post(
            this.getPath(`/tablets/app?TabletID=${BSC_TABLET_ID}&exec=1`),
            {
                Command: {
                    ReassignGroupDisk: {
                        GroupId: groupId,
                        GroupGeneration: groupGeneration,
                        FailRealmIdx: failRealmIdx,
                        FailDomainIdx: failDomainIdx,
                        VDiskIdx: vDiskIdx,
                    },
                },
            },
            {},
            {
                headers: {
                    // This handler requires exactly this string
                    // Automatic headers may not suit
                    Accept: 'application/json',
                },
            },
        );
    }

    killTablet(id: string) {
        return this.get<string>(
            this.getPath(`/tablets?KillTabletID=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }

    stopTablet(id: string, hiveId: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=StopTablet&tablet=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }

    resumeTablet(id: string, hiveId: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=ResumeTablet&tablet=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }

    getTabletFromHive(
        {id, hiveId}: {id: string; hiveId: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<Nullable<TTabletHiveResponse>>(
            this.getPath('/tablets/app'),
            {
                TabletID: hiveId,
                page: 'TabletInfo',
                tablet: id,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
}

import type {ModifyDiskResponse} from '../../types/api/modifyDisk';

import {BaseYdbAPI} from './base';

export class VDiskAPI extends BaseYdbAPI {
    evictVDisk({
        groupId,
        groupGeneration,
        failRealmIdx,
        failDomainIdx,
        vDiskIdx,
        force,
    }: {
        groupId: string | number;
        groupGeneration: string | number;
        failRealmIdx: string | number;
        failDomainIdx: string | number;
        vDiskIdx: string | number;
        force?: boolean;
    }) {
        return this.post<ModifyDiskResponse>(
            this.getPath('/vdisk/evict'),
            {},
            {
                group_id: groupId,
                group_generation_id: groupGeneration,
                fail_realm_idx: failRealmIdx,
                fail_domain_idx: failDomainIdx,
                vdisk_idx: vDiskIdx,
                force,
            },
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }
}

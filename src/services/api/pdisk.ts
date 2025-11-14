import type {ModifyDiskResponse} from '../../types/api/modifyDisk';
import type {EDecommitStatus, TPDiskInfoResponse} from '../../types/api/pdisk';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class PDiskAPI extends BaseYdbAPI {
    restartPDisk({
        nodeId,
        pDiskId,
        force,
    }: {
        nodeId: number | string;
        pDiskId: number | string;
        force?: boolean;
    }) {
        return this.post<ModifyDiskResponse>(
            this.getPath('/pdisk/restart'),
            {},
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
                force,
            },
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }

    changePDiskStatus({
        nodeId,
        pDiskId,
        force,
        decommissionStatus,
    }: {
        nodeId: number | string;
        pDiskId: number | string;
        force?: boolean;
        decommissionStatus?: EDecommitStatus;
    }) {
        return this.post<ModifyDiskResponse>(
            this.getPath('/pdisk/status'),
            {
                decommit_status: decommissionStatus,
            },
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
                force,
            },
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }

    getPDiskInfo(
        {nodeId, pDiskId}: {nodeId: string | number; pDiskId: string | number},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TPDiskInfoResponse>(
            this.getPath('/pdisk/info'),
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }

    restartPDiskOld({nodeId, pDiskId}: {nodeId: number | string; pDiskId: number | string}) {
        const pDiskPath = createPDiskDeveloperUILink({
            nodeId,
            pDiskId,
        });

        return this.post<ModifyDiskResponse>(
            pDiskPath,
            'restartPDisk=',
            {},
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
            },
        );
    }
}

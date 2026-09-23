import React from 'react';

import type {LabelProps} from '@gravity-ui/uikit';
import {Flex, Progress} from '@gravity-ui/uikit';

import {EVDiskDetailedReplicationStatus} from '../../types/api/vdisk';
import {cn} from '../../utils/cn';
import {formatPercent} from '../../utils/dataFormatters/dataFormatters';
import type {PreparedVDisk} from '../../utils/disks/types';
import {formatDurationToShortTimeFormat} from '../../utils/timeParsers';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {DiskStatusLabel} from '../DiskStatus/DiskStatus';

import {vDiskStatusKeyset as i18n} from './i18n';
import {getVDiskReplicationLabel} from './statuses';

import './VDiskStatus.scss';

const b = cn('ydb-vdisk-status');

interface VDiskReplicationStatusProps extends Pick<LabelProps, 'size'> {
    data: Pick<
        PreparedVDisk,
        | 'DetailedReplicationStatus'
        | 'Replicated'
        | 'ReplicationProgress'
        | 'ReplicationSecondsRemaining'
    >;
}

export function VDiskReplicationStatus({data, size}: VDiskReplicationStatusProps) {
    const label = getVDiskReplicationLabel(data);
    const showProgress =
        data.DetailedReplicationStatus === EVDiskDetailedReplicationStatus.InProgress;

    return (
        <React.Fragment>
            {label && <DiskStatusLabel {...label} size={size} />}
            {showProgress && <ReplicationProgress data={data} size={size} />}
        </React.Fragment>
    );
}

function ReplicationProgress({data, size}: VDiskReplicationStatusProps) {
    const progress = parseOptionalNonNegativeNumber(data.ReplicationProgress);
    const percentage =
        progress !== undefined && progress <= 1 ? Math.round(progress * 100) : undefined;
    const seconds = parseOptionalNonNegativeNumber(data.ReplicationSecondsRemaining);
    const remaining =
        seconds !== undefined && seconds > 0
            ? formatDurationToShortTimeFormat(Math.ceil(seconds) * 1000, 2, {compact: true})
            : undefined;
    if (percentage === undefined && !remaining) {
        return null;
    }
    return (
        <Flex alignItems="center" gap={2} className={b('replication-progress', {size})}>
            {percentage !== undefined && (
                <React.Fragment>
                    <span>{formatPercent(percentage / 100, 0)}</span>
                    <div
                        role="progressbar"
                        aria-label={i18n('label_replication-progress')}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percentage}
                        className={b('progress-bar')}
                    >
                        <Progress value={percentage} theme="info" size="xs" />
                    </div>
                </React.Fragment>
            )}
            {remaining && <span>{i18n('context_remaining', {duration: remaining})}</span>}
        </Flex>
    );
}

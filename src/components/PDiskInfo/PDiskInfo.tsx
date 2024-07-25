import {getPDiskPagePath} from '../../routes';
import {valueIsDefined} from '../../utils';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import type {PreparedPDisk} from '../../utils/disks/types';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer/InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';

import {pDiskInfoKeyset} from './i18n';

import './PDiskInfo.scss';

const b = cn('ydb-pdisk-info');

interface GetPDiskInfoOptions<T extends PreparedPDisk> {
    pDisk?: T;
    nodeId?: number | string | null;
    isPDiskPage?: boolean;
}

function getPDiskInfo<T extends PreparedPDisk>({
    pDisk,
    nodeId,
    isPDiskPage = false,
}: GetPDiskInfoOptions<T>) {
    const {
        PDiskId,
        Path,
        Guid,
        Category,
        Type,
        Device,
        Realtime,
        State,
        SerialNumber,
        TotalSize,
        AllocatedSize,
        DecommitStatus,
        StatusV2,
        NumActiveSlots,
        ExpectedSlotCount,
        LogUsedSize,
        LogTotalSize,
        SystemSize,
        SharedWithOs,
    } = pDisk || {};

    const generalInfo: InfoViewerItem[] = [];

    if (valueIsDefined(DecommitStatus)) {
        generalInfo.push({
            label: pDiskInfoKeyset('decomission-status'),
            value: DecommitStatus.replace('DECOMMIT_', ''),
        });
    }
    if (valueIsDefined(Category)) {
        generalInfo.push({label: pDiskInfoKeyset('type'), value: Type});
    }
    if (valueIsDefined(Path)) {
        generalInfo.push({label: pDiskInfoKeyset('path'), value: Path});
    }
    if (valueIsDefined(Guid)) {
        generalInfo.push({label: pDiskInfoKeyset('guid'), value: Guid});
    }
    // SerialNumber could be an empty string ""
    if (SerialNumber) {
        generalInfo.push({
            label: pDiskInfoKeyset('serial-number'),
            value: SerialNumber,
        });
    }
    if (valueIsDefined(SharedWithOs)) {
        generalInfo.push({
            label: pDiskInfoKeyset('shared-with-os'),
            value: pDiskInfoKeyset('yes'),
        });
    }

    const statusInfo: InfoViewerItem[] = [];

    if (valueIsDefined(StatusV2)) {
        statusInfo.push({label: pDiskInfoKeyset('drive-status'), value: StatusV2});
    }
    if (valueIsDefined(State)) {
        statusInfo.push({label: pDiskInfoKeyset('state'), value: State});
    }
    if (valueIsDefined(Device)) {
        statusInfo.push({
            label: pDiskInfoKeyset('device'),
            value: <EntityStatus status={Device} />,
        });
    }
    if (valueIsDefined(Realtime)) {
        statusInfo.push({
            label: pDiskInfoKeyset('realtime'),
            value: <EntityStatus status={Realtime} />,
        });
    }

    const spaceInfo: InfoViewerItem[] = [];

    spaceInfo.push({
        label: pDiskInfoKeyset('space'),
        value: (
            <ProgressViewer
                value={AllocatedSize}
                capacity={TotalSize}
                formatValues={formatStorageValuesToGb}
                colorizeProgress={true}
            />
        ),
    });
    if (valueIsDefined(NumActiveSlots) && valueIsDefined(ExpectedSlotCount)) {
        spaceInfo.push({
            label: pDiskInfoKeyset('slots'),
            value: <ProgressViewer value={NumActiveSlots} capacity={ExpectedSlotCount} />,
        });
    }
    if (valueIsDefined(LogUsedSize) && valueIsDefined(LogTotalSize)) {
        spaceInfo.push({
            label: pDiskInfoKeyset('log-size'),
            value: (
                <ProgressViewer
                    value={LogUsedSize}
                    capacity={LogTotalSize}
                    formatValues={formatStorageValuesToGb}
                />
            ),
        });
    }
    if (valueIsDefined(SystemSize)) {
        spaceInfo.push({
            label: pDiskInfoKeyset('system-size'),
            value: formatBytes({value: SystemSize}),
        });
    }

    const additionalInfo: InfoViewerItem[] = [];

    if (valueIsDefined(PDiskId) && valueIsDefined(nodeId)) {
        const pDiskPagePath = getPDiskPagePath(PDiskId, nodeId);
        const pDiskInternalViewerPath = createPDiskDeveloperUILink({
            nodeId,
            pDiskId: PDiskId,
        });

        additionalInfo.push({
            label: pDiskInfoKeyset('links'),
            value: (
                <span className={b('links')}>
                    {!isPDiskPage && (
                        <LinkWithIcon
                            title={pDiskInfoKeyset('pdisk-page')}
                            url={pDiskPagePath}
                            external={false}
                        />
                    )}
                    <LinkWithIcon
                        title={pDiskInfoKeyset('developer-ui')}
                        url={pDiskInternalViewerPath}
                    />
                </span>
            ),
        });
    }

    return [generalInfo, statusInfo, spaceInfo, additionalInfo];
}

interface PDiskInfoProps<T extends PreparedPDisk> extends GetPDiskInfoOptions<T> {
    className?: string;
}

export function PDiskInfo<T extends PreparedPDisk>({
    pDisk,
    nodeId,
    isPDiskPage = false,
    className,
}: PDiskInfoProps<T>) {
    const [generalInfo, statusInfo, spaceInfo, additionalInfo] = getPDiskInfo({
        pDisk,
        nodeId,
        isPDiskPage,
    });

    return (
        <div className={b('wrapper', className)}>
            <div className={b('col')}>
                <InfoViewer info={generalInfo} />
                <InfoViewer info={spaceInfo} />
            </div>
            <div className={b('col')}>
                <InfoViewer info={statusInfo} />
                <InfoViewer info={additionalInfo} />
            </div>
        </div>
    );
}

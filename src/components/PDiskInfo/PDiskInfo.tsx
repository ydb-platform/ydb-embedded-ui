import {Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {getPDiskPagePath} from '../../routes';
import {formatBytes} from '../../utils/bytesParsers';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer/InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {StatusIcon} from '../StatusIcon/StatusIcon';

import {pDiskInfoKeyset} from './i18n';

interface GetPDiskInfoOptions<T extends PreparedPDisk> {
    pDisk?: T;
    nodeId?: number | string | null;
    withPDiskPageLink?: boolean;
    isUserAllowedToMakeChanges?: boolean;
}

// eslint-disable-next-line complexity
function getPDiskInfo<T extends PreparedPDisk>({
    pDisk,
    nodeId,
    withPDiskPageLink,
    isUserAllowedToMakeChanges,
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
        StatusV2,
        NumActiveSlots,
        ExpectedSlotCount,
        LogUsedSize,
        LogTotalSize,
        SystemSize,
        SharedWithOs,
    } = pDisk || {};

    const generalInfo: InfoViewerItem[] = [];

    if (!isNil(Category)) {
        generalInfo.push({label: pDiskInfoKeyset('type'), value: Type});
    }
    if (!isNil(Path)) {
        generalInfo.push({label: pDiskInfoKeyset('path'), value: Path});
    }
    if (!isNil(Guid)) {
        generalInfo.push({label: pDiskInfoKeyset('guid'), value: Guid});
    }
    // SerialNumber could be an empty string ""
    if (SerialNumber) {
        generalInfo.push({
            label: pDiskInfoKeyset('serial-number'),
            value: SerialNumber,
        });
    }
    if (SharedWithOs) {
        generalInfo.push({
            label: pDiskInfoKeyset('shared-with-os'),
            value: pDiskInfoKeyset('yes'),
        });
    }

    const statusInfo: InfoViewerItem[] = [];

    if (!isNil(StatusV2)) {
        statusInfo.push({label: pDiskInfoKeyset('drive-status'), value: StatusV2});
    }
    if (!isNil(State)) {
        statusInfo.push({label: pDiskInfoKeyset('state'), value: State});
    }
    if (!isNil(Device)) {
        statusInfo.push({
            label: pDiskInfoKeyset('device'),
            value: <StatusIcon status={Device} />,
        });
    }
    if (!isNil(Realtime)) {
        statusInfo.push({
            label: pDiskInfoKeyset('realtime'),
            value: <StatusIcon status={Realtime} />,
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
    if (!isNil(NumActiveSlots) && !isNil(ExpectedSlotCount)) {
        spaceInfo.push({
            label: pDiskInfoKeyset('slots'),
            value: <ProgressViewer value={NumActiveSlots} capacity={ExpectedSlotCount} />,
        });
    }
    if (!isNil(LogUsedSize) && !isNil(LogTotalSize)) {
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
    if (!isNil(SystemSize)) {
        spaceInfo.push({
            label: pDiskInfoKeyset('system-size'),
            value: formatBytes({value: SystemSize}),
        });
    }

    const additionalInfo: InfoViewerItem[] = [];
    const shouldDisplayLinks =
        (withPDiskPageLink || isUserAllowedToMakeChanges) && !isNil(PDiskId) && !isNil(nodeId);
    if (shouldDisplayLinks) {
        const pDiskPagePath = getPDiskPagePath(PDiskId, nodeId);
        const pDiskInternalViewerPath = createPDiskDeveloperUILink({
            nodeId,
            pDiskId: PDiskId,
        });

        additionalInfo.push({
            label: pDiskInfoKeyset('links'),
            value: (
                <Flex wrap="wrap" gap={2}>
                    {withPDiskPageLink && (
                        <LinkWithIcon
                            title={pDiskInfoKeyset('pdisk-page')}
                            url={pDiskPagePath}
                            external={false}
                        />
                    )}
                    {isUserAllowedToMakeChanges && (
                        <LinkWithIcon
                            title={pDiskInfoKeyset('developer-ui')}
                            url={pDiskInternalViewerPath}
                        />
                    )}
                </Flex>
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
    withPDiskPageLink,
    className,
}: PDiskInfoProps<T>) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const [generalInfo, statusInfo, spaceInfo, additionalInfo] = getPDiskInfo({
        pDisk,
        nodeId,
        withPDiskPageLink,
        isUserAllowedToMakeChanges,
    });

    return (
        <Flex className={className} gap={2} direction="row" wrap>
            <Flex direction="column" gap={2} width={500}>
                <InfoViewer info={generalInfo} renderEmptyState={() => null} />
                <InfoViewer info={spaceInfo} renderEmptyState={() => null} />
            </Flex>
            <Flex direction="column" gap={2} width={500}>
                <InfoViewer info={statusInfo} renderEmptyState={() => null} />
                <InfoViewer info={additionalInfo} renderEmptyState={() => null} />
            </Flex>
        </Flex>
    );
}

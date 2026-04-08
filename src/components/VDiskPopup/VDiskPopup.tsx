import React from 'react';

import {Divider, Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {EVDiskState} from '../../types/api/vdisk';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatDurationSeconds, stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {getStateSeverity} from '../../utils/disks/calculateVDiskSeverity';
import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NUMERIC_SEVERITY_TO_LABEL_VIEW,
    VDISK_LABEL_CONFIG,
} from '../../utils/disks/constants';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToGB, bytesToSpeed} from '../../utils/utils';
import {EvictVDiskButton, isAllVdiskParamsDefined} from '../EvictVDiskButton/EvictVDiskButton';
import {InternalLink} from '../InternalLink';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {
    buildPDiskFooter,
    preparePDiskData,
    preparePDiskHeaderLabels,
} from '../PDiskPopup/PDiskPopup';
import {StatusIcon} from '../StatusIcon/StatusIcon';
import {vDiskInfoKeyset} from '../VDiskInfo/i18n';
import type {
    YDBDefinitionListHeaderLabel,
    YDBDefinitionListItem,
} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {vDiskPopupKeyset} from './i18n';

import './VDiskPopup.scss';

const b = cn('vdisk-storage-popup');

const prepareUnavailableVDiskData = (data: UnavailableDonor) => {
    const {NodeId, PDiskId, VSlotId, StoragePoolName} = data;

    const vdiskData: YDBDefinitionListItem[] = [];

    if (StoragePoolName) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_storage-pool'),
            content: StoragePoolName,
            copyText: StoragePoolName,
        });
    }

    vdiskData.push(
        {
            name: vDiskPopupKeyset('label_node-id'),
            content: NodeId ?? EMPTY_DATA_PLACEHOLDER,
            copyText: NodeId,
        },
        {
            name: vDiskPopupKeyset('label_pdisk-id'),
            content: PDiskId ?? EMPTY_DATA_PLACEHOLDER,
            copyText: PDiskId,
        },
        {
            name: vDiskPopupKeyset('label_vslot-id'),
            content: VSlotId ?? EMPTY_DATA_PLACEHOLDER,
            copyText: VSlotId,
        },
    );

    return vdiskData;
};

const buildUnavailableVDiskFooter = (
    data: UnavailableDonor,
    withDeveloperUILink?: boolean,
): React.ReactNode | null => {
    const {NodeId, PDiskId, VSlotId} = data;

    if (!withDeveloperUILink || isNil(NodeId) || isNil(PDiskId) || isNil(VSlotId)) {
        return null;
    }

    const vDiskInternalViewerPath = createVDiskDeveloperUILink({
        nodeId: NodeId,
        pDiskId: PDiskId,
        vDiskSlotId: VSlotId,
    });

    return (
        <div className={b('links')}>
            <LinkWithIcon title={'Developer UI'} url={vDiskInternalViewerPath} />
        </div>
    );
};

interface VDiskLinkProps {
    nodeId?: string | number;
    stringifiedId?: string;
    getVDiskLinkFn?: (data: {
        nodeId: string | number | undefined;
        vDiskId: string | undefined;
    }) => string | undefined;
}

const VDiskLink = ({nodeId, stringifiedId, getVDiskLinkFn}: VDiskLinkProps) => {
    if (isNil(stringifiedId)) {
        return <span>{EMPTY_DATA_PLACEHOLDER}</span>;
    }

    const path = getVDiskLinkFn?.({nodeId, vDiskId: stringifiedId});

    return path ? (
        <InternalLink to={path}>
            {vDiskPopupKeyset('label_vdisk')} {stringifiedId}
        </InternalLink>
    ) : (
        <span>{stringifiedId}</span>
    );
};

// eslint-disable-next-line complexity
const prepareVDiskData = (
    data: PreparedVDisk,
    getVDiskLinkFn?: (data: {
        nodeId: string | number | undefined;
        vDiskId: string | undefined;
    }) => string | undefined,
) => {
    const {
        VDiskState,
        SatisfactionRank,
        DiskSpace,
        FrontQueues,
        Replicated,
        ReplicationProgress,
        ReplicationSecondsRemaining,
        UnsyncedVDisks,
        AllocatedSize,
        AvailableSize,
        ReadThroughput,
        WriteThroughput,
        StoragePoolName,
        Donors,
        DonorMode,
        Recipient,
    } = data;

    const vdiskData: YDBDefinitionListItem[] = [];

    if (StoragePoolName) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_storage-pool'),
            content: StoragePoolName,
            copyText: StoragePoolName,
        });
    }

    // Show donors if they exist
    if (Donors?.length) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_donor'),
            content: (
                <Flex direction="column" gap={1}>
                    {Donors.map((donor) => (
                        <VDiskLink
                            key={donor.StringifiedId}
                            nodeId={donor.NodeId}
                            stringifiedId={donor.StringifiedId}
                            getVDiskLinkFn={getVDiskLinkFn}
                        />
                    ))}
                </Flex>
            ),
        });
    }

    if (DonorMode && Recipient) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_recipient'),
            content: (
                <VDiskLink
                    nodeId={Recipient.NodeId}
                    stringifiedId={Recipient.StringifiedId}
                    getVDiskLinkFn={getVDiskLinkFn}
                />
            ),
        });
    }

    if (SatisfactionRank && SatisfactionRank.FreshRank?.Flag !== EFlag.Green) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_fresh'),
            content: SatisfactionRank.FreshRank?.Flag,
        });
    }

    if (SatisfactionRank && SatisfactionRank.LevelRank?.Flag !== EFlag.Green) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_level'),
            content: SatisfactionRank.LevelRank?.Flag,
        });
    }

    if (SatisfactionRank && SatisfactionRank.FreshRank?.RankPercent) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_fresh'),
            content: SatisfactionRank.FreshRank.RankPercent,
        });
    }

    if (SatisfactionRank && SatisfactionRank.LevelRank?.RankPercent) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_level'),
            content: SatisfactionRank.LevelRank.RankPercent,
        });
    }

    if (DiskSpace) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_space'),
            content: <StatusIcon mode="icons" status={DiskSpace} />,
        });
    }

    if (FrontQueues) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_front-queues'),
            content: <StatusIcon mode="icons" status={FrontQueues} />,
        });
    }

    if (Replicated === false && VDiskState === EVDiskState.OK && !DonorMode) {
        vdiskData.push({name: vDiskPopupKeyset('label_replicated'), content: 'NO'});

        // Only show replication progress and time remaining when disk is not replicated and state is OK
        if (!isNil(ReplicationProgress) && !isNaN(Number(ReplicationProgress))) {
            const progressPercent = Math.round(ReplicationProgress * 100);
            vdiskData.push({
                name: vDiskPopupKeyset('label_progress'),
                content: `${progressPercent}%`,
            });
        }

        if (!isNil(ReplicationSecondsRemaining)) {
            const timeRemaining = formatDurationSeconds(ReplicationSecondsRemaining);
            if (timeRemaining) {
                vdiskData.push({
                    name: vDiskPopupKeyset('label_remaining'),
                    content: timeRemaining,
                });
            }
        }
    }

    if (UnsyncedVDisks) {
        vdiskData.push({name: vDiskPopupKeyset('label_unsync-vdisks'), content: UnsyncedVDisks});
    }

    if (Number(AllocatedSize)) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_allocated'),
            content: bytesToGB(AllocatedSize),
        });
    }

    if (Number(AvailableSize)) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_available'),
            content: bytesToGB(AvailableSize),
        });
    }

    if (Number(ReadThroughput)) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_read'),
            content: bytesToSpeed(ReadThroughput),
        });
    }

    if (Number(WriteThroughput)) {
        vdiskData.push({
            name: vDiskPopupKeyset('label_write'),
            content: bytesToSpeed(WriteThroughput),
        });
    }

    return vdiskData;
};

const buildVDiskFooter = (
    data: PreparedVDisk,
    withDeveloperUILink?: boolean,
    getVDiskLinkFn?: (data: {
        nodeId: string | number;
        vDiskId: string | undefined;
    }) => string | undefined,
    onSuccess?: () => void,
): React.ReactNode | null => {
    const {NodeId, PDiskId, VDiskSlotId, StringifiedId, VDiskId, DonorMode} = data;

    const vDiskInternalViewerPath =
        withDeveloperUILink && !isNil(VDiskSlotId) && !isNil(NodeId) && !isNil(PDiskId)
            ? createVDiskDeveloperUILink({
                  nodeId: NodeId,
                  pDiskId: PDiskId,
                  vDiskSlotId: VDiskSlotId,
              })
            : undefined;

    const vDiskPagePath =
        withDeveloperUILink && !isNil(NodeId) && !isNil(StringifiedId)
            ? getVDiskLinkFn?.({
                  nodeId: NodeId,
                  vDiskId: StringifiedId,
              })
            : undefined;

    const hasLinks = vDiskPagePath || vDiskInternalViewerPath;

    const isVDiskParamsDefined = isAllVdiskParamsDefined(VDiskId);

    if (!hasLinks && !isVDiskParamsDefined) {
        return null;
    }

    return (
        <Flex direction="column" gap={3}>
            {hasLinks && (
                <Flex className={b('links')} wrap="wrap" gap={2}>
                    {vDiskPagePath && (
                        <LinkWithIcon
                            key={vDiskPagePath}
                            title={vDiskInfoKeyset('vdisk-page')}
                            url={vDiskPagePath}
                            external={false}
                        />
                    )}
                    {vDiskInternalViewerPath && (
                        <LinkWithIcon
                            title={vDiskInfoKeyset('developer-ui')}
                            url={vDiskInternalViewerPath}
                        />
                    )}
                </Flex>
            )}
            {isVDiskParamsDefined && (
                <EvictVDiskButton
                    vDiskId={VDiskId}
                    donorMode={DonorMode}
                    fullWidth
                    onSuccess={onSuccess}
                />
            )}
        </Flex>
    );
};

const prepareHeaderLabels = (data: PreparedVDisk): YDBDefinitionListHeaderLabel[] => {
    const labels: YDBDefinitionListHeaderLabel[] = [];

    const {VDiskState, DonorMode, Severity} = data;

    const isReplicatingColor = Severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;

    if (DonorMode) {
        const donorConfig = VDISK_LABEL_CONFIG.donor;

        labels.push({
            id: 'donor',
            value: vDiskPopupKeyset('label_donor'),
            theme: donorConfig.theme,
            icon: donorConfig.icon,
        });
    } else if (isReplicatingColor) {
        const replicaConfig = VDISK_LABEL_CONFIG.replica;

        labels.push({
            id: 'replication',
            value: vDiskPopupKeyset('label_replication'),
            theme: replicaConfig.theme,
            icon: replicaConfig.icon,
        });
    }

    const severity = getStateSeverity(VDiskState);

    const {theme: stateTheme, icon: stateIcon} = NUMERIC_SEVERITY_TO_LABEL_VIEW[severity];

    const value = VDiskState ?? vDiskPopupKeyset('context_not-available');

    labels.push({
        id: 'state',
        value,
        theme: stateTheme,
        icon: stateIcon,
    });

    return labels;
};

interface VDiskPopupProps {
    data: PreparedVDisk | UnavailableDonor;
}

export const VDiskPopup = ({data}: VDiskPopupProps) => {
    const dispatch = useTypedDispatch();
    const isFullData = isFullVDiskData(data);
    const isViewerUser = useIsViewerUser();

    const hasDeveloperUi = useHasDeveloperUi();
    const getVDiskLink = useVDiskPagePath();

    const database = useDatabaseFromQuery();

    const vdiskInfo = React.useMemo(
        () =>
            isFullData ? prepareVDiskData(data, getVDiskLink) : prepareUnavailableVDiskData(data),
        [data, isFullData, getVDiskLink],
    );

    const handleAfterEvictVDisk = React.useCallback(() => {
        const vDiskId = 'VDiskId' in data ? stringifyVdiskId(data.VDiskId) : undefined;
        dispatch(
            api.util.invalidateTags([
                'TableData',
                'StorageData',
                {
                    type: 'VDiskData',
                    id: vDiskId,
                },
            ]),
        );
    }, [dispatch, data]);

    const vdiskHeaderLabels: YDBDefinitionListHeaderLabel[] = React.useMemo(
        () => (isFullData ? prepareHeaderLabels(data) : []),
        [data, isFullData],
    );

    const vdiskFooter = React.useMemo(
        () =>
            isFullData
                ? buildVDiskFooter(data, hasDeveloperUi, getVDiskLink, handleAfterEvictVDisk)
                : buildUnavailableVDiskFooter(data, hasDeveloperUi),
        [data, isFullData, hasDeveloperUi, getVDiskLink, handleAfterEvictVDisk],
    );

    const nodesMap = useTypedSelector((state) => selectNodesMap(state, database));
    const nodeData = isNil(data.NodeId) ? undefined : nodesMap?.get(data.NodeId);
    const pdiskInfo = React.useMemo(
        () => isFullData && data.PDisk && preparePDiskData(data.PDisk, nodeData),
        [data, nodeData, isFullData],
    );
    const pdiskHeaderLabels = React.useMemo(
        () => (isFullData && data.PDisk ? preparePDiskHeaderLabels(data.PDisk) : []),
        [data, isFullData],
    );

    const pdiskFooter = React.useMemo(
        () => (isFullData && data.PDisk ? buildPDiskFooter(data.PDisk, hasDeveloperUi) : null),
        [data, isFullData, hasDeveloperUi],
    );

    const vdiskId = isFullData ? data.StringifiedId : undefined;
    const pdiskId = isFullData ? data.PDisk?.StringifiedId : undefined;

    return (
        <div className={b()}>
            <YDBDefinitionList
                compact
                title="VDisk"
                titleSuffix={{title: vdiskId ?? EMPTY_DATA_PLACEHOLDER, copyText: vdiskId}}
                items={vdiskInfo}
                headerLabels={vdiskHeaderLabels}
                nameMaxWidth={100}
                footer={vdiskFooter}
            />
            {pdiskInfo && isViewerUser && (
                <React.Fragment>
                    <Divider className={b('custom-divider')} />
                    <YDBDefinitionList
                        compact
                        title="PDisk"
                        titleSuffix={{title: pdiskId ?? EMPTY_DATA_PLACEHOLDER, copyText: pdiskId}}
                        items={pdiskInfo}
                        headerLabels={pdiskHeaderLabels}
                        footer={pdiskFooter}
                        nameMaxWidth={100}
                    />
                </React.Fragment>
            )}
        </div>
    );
};

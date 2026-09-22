import React from 'react';

import {ChevronDown, ChevronUp, Wrench} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';
import {
    Button,
    ClipboardButton,
    Divider,
    Flex,
    Icon,
    Label,
    Progress,
    Text,
    Tooltip,
} from '@gravity-ui/uikit';
import {capitalize, isNil} from 'lodash';

import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag, isCapacityAlert} from '../../types/api/enums';
import type {TVDiskID} from '../../types/api/vdisk';
import {EVDiskDetailedReplicationStatus} from '../../types/api/vdisk';
import type {NodeMetadata} from '../../types/store/nodesList';
import {getCapacityAlertTheme, normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatPercent, parseVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {VDISK_LABEL_CONFIG} from '../../utils/disks/constants';
import {isFullVDiskData} from '../../utils/disks/helpers';
import {calculateFrontQueuesIcon, getFlagIconWithColor} from '../../utils/disks/iconCalculators';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {formatMetricPercent, formatStorageMetricPair} from '../../utils/storageMetrics';
import {formatDurationToShortTimeFormat} from '../../utils/timeParsers';
import {bytesToSpeed, parseOptionalNonNegativeNumber} from '../../utils/utils';
import {EFlagToLabelTheme} from '../EntityStatus/utils';
import {EvictVDiskButton, isAllVdiskParamsDefined} from '../EvictVDiskButton/EvictVDiskButton';
import {InternalLink} from '../InternalLink';
import {InternalLinkButton} from '../InternalLinkButton';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {PDiskPopup} from '../PDiskPopup/PDiskPopup';
import {getFlagStatusText} from '../VDisk/getFlagStatusText';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';
import {
    CAPACITY_CONFIGURATION_HELP_TEXT,
    CAPACITY_METRICS_HELP_TEXT,
} from '../capacityMetricsColumns/constants';
import {formatCapacityUnitCount} from '../capacityMetricsColumns/formatters';

import {vDiskPopupKeyset as i18n} from './i18n';
import type {VDiskStatusLabel} from './statuses';
import {getVDiskReplicationLabel, getVDiskStateLabel} from './statuses';

import './VDiskPopup.scss';

const b = cn('ydb-vdisk-popup');

function StatusLabel({
    value,
    theme = 'normal',
    icon,
    title,
    tooltip,
    dangerHeavy,
    size = 's',
}: VDiskStatusLabel & Pick<LabelProps, 'size'>) {
    const label = (
        <Label
            size={size}
            theme={theme}
            className={b('status-label', {'danger-heavy': dangerHeavy})}
            icon={icon ? <Icon data={icon} size={12} /> : undefined}
            value={title ? value : undefined}
        >
            {title ?? value}
        </Label>
    );
    return tooltip ? (
        <Tooltip content={tooltip} placement="top">
            <span tabIndex={0} className={b('status-tooltip')}>
                {label}
            </span>
        </Tooltip>
    ) : (
        label
    );
}

function getFlagLabel(flag?: EFlag, title?: string, frontQueues = false) {
    if (!flag || flag === EFlag.Grey) {
        return null;
    }

    const theme = EFlagToLabelTheme[flag] ?? 'normal';
    const icon = frontQueues
        ? calculateFrontQueuesIcon({FrontQueues: flag})
        : getFlagIconWithColor(flag)?.icon;

    return (
        <StatusLabel
            value={getFlagStatusText(flag)}
            title={title}
            theme={theme}
            icon={icon}
            dangerHeavy={flag === EFlag.Red}
            size="xs"
        />
    );
}

function DiskLocation({
    data,
    nodeData,
}: {
    data: PreparedVDisk | UnavailableDonor;
    nodeData: NodeMetadata;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const detailsId = React.useId();
    const fullData = isFullVDiskData(data) ? data : undefined;
    const slotId = isFullVDiskData(data) ? data.VDiskSlotId : data.VSlotId;
    const entries = [
        {name: i18n('label_fqdn'), value: nodeData.Host},
        {name: i18n('label_rack'), value: nodeData.Rack},
        {name: i18n('label_datacenter'), value: nodeData.DC},
        {name: i18n('label_pdisk-path'), value: fullData?.PDiskPath ?? fullData?.PDisk?.Path},
        {name: i18n('label_node-id'), value: data.NodeId},
        {name: i18n('label_pdisk-id'), value: data.PDiskId},
        {name: i18n('label_vslot-id'), value: slotId},
    ];
    const items = entries.flatMap(({name, value}) =>
        isNil(value) || value === '' ? [] : [{name, content: value, copyText: value}],
    );
    if (!items.length) {
        return null;
    }
    const hasDetails = items.length > 2;
    return (
        <div className={b('location')}>
            <div className={b('location-summary', {'with-toggle': hasDetails})}>
                <YDBDefinitionList
                    items={items.slice(0, 2)}
                    nameMaxWidth={100}
                    className={b('properties', {location: true})}
                />
                {hasDetails && (
                    <Button
                        view="flat-secondary"
                        size="xs"
                        className={b('location-toggle')}
                        aria-label={i18n(
                            expanded ? 'action_collapse-details' : 'action_expand-details',
                        )}
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <Icon data={expanded ? ChevronUp : ChevronDown} size={12} />
                    </Button>
                )}
            </div>
            {hasDetails && (
                <div id={detailsId} hidden={!expanded} className={b('location-details')}>
                    <YDBDefinitionList
                        items={items.slice(2)}
                        nameMaxWidth={100}
                        className={b('properties', {location: true})}
                    />
                </div>
            )}
        </div>
    );
}

function ReplicationProgress({data}: {data: PreparedVDisk}) {
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
        <Flex alignItems="center" gap={2} className={b('replication-progress')}>
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

function getRuntimeItems(data: PreparedVDisk): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [];
    const frontQueues = getFlagLabel(data.FrontQueues, undefined, true);
    if (frontQueues) {
        items.push({name: i18n('label_front-queues'), content: frontQueues});
    }
    const fresh = getFlagLabel(data.SatisfactionRank?.FreshRank?.Flag, i18n('label_fresh'));
    const level = getFlagLabel(data.SatisfactionRank?.LevelRank?.Flag, i18n('label_level'));
    if (fresh || level) {
        items.push({
            name: i18n('label_compaction'),
            content: (
                <Flex direction="column" gap={1} alignItems="flex-start">
                    {fresh}
                    {level}
                </Flex>
            ),
        });
    }
    for (const [name, value] of [
        [i18n('label_read'), data.ReadThroughput],
        [i18n('label_write'), data.WriteThroughput],
    ] as const) {
        if (parseOptionalNonNegativeNumber(value) !== undefined) {
            items.push({name, content: bytesToSpeed(value)});
        }
    }
    return items;
}

function getStorageItems(
    data: PreparedVDisk,
    capacityMetricsEnabled: boolean,
): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [];
    if (data.StoragePoolName) {
        items.push({
            name: i18n('label_storage-pool'),
            content: data.StoragePoolName,
            copyText: data.StoragePoolName,
        });
    }
    if (parseOptionalNonNegativeNumber(data.GroupSizeInUnits) !== undefined) {
        items.push({
            name: i18n('label_group-size'),
            content: formatCapacityUnitCount(data.GroupSizeInUnits),
            note: CAPACITY_CONFIGURATION_HELP_TEXT.GroupSizeInUnits,
        });
    }
    const size = capacityMetricsEnabled ? (data.WhiteboardSize ?? data) : data;
    if (
        parseOptionalNonNegativeNumber(size.AllocatedSize) !== undefined ||
        parseOptionalNonNegativeNumber(size.SizeLimit) !== undefined
    ) {
        items.push({
            name: i18n('label_size'),
            content: formatStorageMetricPair(size.AllocatedSize, size.SizeLimit),
        });
    }
    const capacityAlert = normalizeCapacityAlert(data.CapacityAlert);
    if (capacityAlert) {
        items.push({
            name: i18n('label_capacity-alert'),
            content: (
                <StatusLabel
                    size="xs"
                    value={capitalize(capacityAlert.replaceAll('_', ' '))}
                    theme={
                        isCapacityAlert(capacityAlert)
                            ? getCapacityAlertTheme(capacityAlert)
                            : 'normal'
                    }
                />
            ),
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        });
    }
    for (const [name, value, note] of [
        [
            i18n('label_slot-usage'),
            data.VDiskSlotUsage,
            CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        ],
        [i18n('label_raw-usage'), data.VDiskRawUsage, CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage],
    ] as const) {
        if (parseOptionalNonNegativeNumber(value) !== undefined) {
            items.push({name, content: formatMetricPercent(value), note});
        }
    }
    return items;
}

function DiskHeader({data = {}}: {data?: PreparedVDisk}) {
    const {StringifiedId, PDiskType, PDisk, DonorMode} = data;
    const type = PDiskType ?? PDisk?.Type;
    const typeLabel = type?.toUpperCase() === 'NVME' ? 'NVMe' : type;
    const stateLabel = getVDiskStateLabel(data);
    const replicationLabel = getVDiskReplicationLabel(data);
    const showReplicationProgress =
        data.DetailedReplicationStatus === EVDiskDetailedReplicationStatus.InProgress;

    return (
        <React.Fragment>
            <Flex gap={1} alignItems="center" wrap="wrap" className={b('header')}>
                <Text variant="subheader-2">{i18n('label_vdisk')}</Text>
                <Text color="secondary">•</Text>
                <Text variant="body-2" color="secondary" className={b('id')}>
                    {StringifiedId ?? EMPTY_DATA_PLACEHOLDER}
                </Text>
                {StringifiedId && (
                    <ClipboardButton
                        text={StringifiedId}
                        size="s"
                        view="flat-secondary"
                        aria-label={i18n('action_copy-field', {field: i18n('label_vdisk')})}
                    />
                )}
                {typeLabel && <Label size="s">{typeLabel}</Label>}
            </Flex>
            <Flex gap={1} wrap="wrap" alignItems="center">
                <StatusLabel {...stateLabel} />
                {DonorMode && (
                    <StatusLabel value={i18n('label_donor')} {...VDISK_LABEL_CONFIG.donor} />
                )}
                {replicationLabel && <StatusLabel {...replicationLabel} />}
                {showReplicationProgress && <ReplicationProgress data={data} />}
            </Flex>
        </React.Fragment>
    );
}

/**
 * Resolve VDiskId from PreparedVDisk data.
 * Prefers the structured VDiskId when all fields are present,
 * falls back to parsing StringifiedId (e.g. "123-1-0-0-0").
 */
const resolveVDiskId = (data: PreparedVDisk): Required<TVDiskID> | undefined => {
    if (isAllVdiskParamsDefined(data.VDiskId)) {
        return data.VDiskId;
    }
    const parsed = parseVdiskId(data.StringifiedId);
    return isAllVdiskParamsDefined(parsed) ? parsed : undefined;
};

function DiskFooter({
    data,
    onSuccess,
}: {
    data: PreparedVDisk | UnavailableDonor;
    onSuccess: VoidFunction;
}) {
    const hasDeveloperUi = useHasDeveloperUi();
    const getVDiskLink = useVDiskPagePath();
    const fullData = isFullVDiskData(data) ? data : undefined;
    const vdiskId = fullData?.StringifiedId;
    const slotId = isFullVDiskData(data) ? data.VDiskSlotId : data.VSlotId;
    const resolvedId = fullData ? resolveVDiskId(fullData) : undefined;
    const developerLink =
        hasDeveloperUi && !isNil(data.NodeId) && !isNil(data.PDiskId) && !isNil(slotId)
            ? createVDiskDeveloperUILink({
                  nodeId: data.NodeId,
                  pDiskId: data.PDiskId,
                  vDiskSlotId: slotId,
              })
            : undefined;
    const pageLink =
        hasDeveloperUi && !isNil(data.NodeId) && vdiskId
            ? getVDiskLink({nodeId: data.NodeId, vDiskId: vdiskId})
            : undefined;
    return (
        <React.Fragment>
            {developerLink && (
                <LinkWithIcon
                    title={i18n('action_open-in-developer-ui')}
                    url={developerLink}
                    icon={Wrench}
                    hideEndIcon
                />
            )}
            {(pageLink || resolvedId) && (
                <Flex gap={2} wrap="wrap" className={b('actions')}>
                    {pageLink && (
                        <InternalLinkButton
                            href={pageLink}
                            view="action"
                            size="m"
                            className={BRAND_BUTTON_CLASS}
                        >
                            {i18n('action_go-to-vdisk')}
                        </InternalLinkButton>
                    )}
                    {resolvedId && (
                        <EvictVDiskButton
                            vDiskId={resolvedId}
                            donorMode={fullData?.DonorMode}
                            onSuccess={onSuccess}
                        />
                    )}
                </Flex>
            )}
        </React.Fragment>
    );
}

function getRelationItems(data: PreparedVDisk, getVDiskLink: ReturnType<typeof useVDiskPagePath>) {
    const relationItems: YDBDefinitionListItem[] = [];
    const renderDiskLink = (disk: {NodeId?: number; StringifiedId?: string}) => {
        const path = getVDiskLink({nodeId: disk.NodeId, vDiskId: disk.StringifiedId});
        const title = `${i18n('label_vdisk')} ${disk.StringifiedId ?? EMPTY_DATA_PLACEHOLDER}`;
        return path ? <InternalLink to={path}>{title}</InternalLink> : title;
    };
    if (data?.Donors?.length) {
        relationItems.push({
            name: i18n('label_donor'),
            content: (
                <Flex direction="column" gap={1}>
                    {data.Donors.map((disk, index) => (
                        <React.Fragment key={disk.StringifiedId ?? index}>
                            {renderDiskLink(disk)}
                        </React.Fragment>
                    ))}
                </Flex>
            ),
        });
    }
    if (data?.DonorMode && data.Recipient) {
        relationItems.push({
            name: i18n('label_recipient'),
            content: renderDiskLink(data.Recipient),
        });
    }
    if (parseOptionalNonNegativeNumber(data?.UnsyncedVDisks)) {
        relationItems.push({name: i18n('label_unsync-vdisks'), content: data?.UnsyncedVDisks});
    }
    return relationItems;
}

function useNodeMetadata(nodeId: number | undefined, parentNodeData?: NodeMetadata): NodeMetadata {
    const database = useDatabaseFromQuery();
    const nodesMap = useTypedSelector((state) => selectNodesMap(state, database));
    const storedNodeData = isNil(nodeId) ? undefined : nodesMap?.get(nodeId);
    return {
        Host: parentNodeData?.Host || storedNodeData?.Host,
        DC: parentNodeData?.DC || storedNodeData?.DC,
        Rack: parentNodeData?.Rack || storedNodeData?.Rack,
    };
}

interface VDiskPopupProps {
    data: PreparedVDisk | UnavailableDonor;
    nodeData?: NodeMetadata;
    onClose?: VoidFunction;
}

export function VDiskPopup({data, nodeData: parentNodeData, onClose}: VDiskPopupProps) {
    const dispatch = useTypedDispatch();
    const nodeData = useNodeMetadata(data.NodeId, parentNodeData);
    const isViewerUser = useIsViewerUser();
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const getVDiskLink = useVDiskPagePath();
    const fullData = isFullVDiskData(data) ? data : undefined;
    const vdiskId = fullData?.StringifiedId;
    const handleAfterEvictVDisk = () => {
        dispatch(
            api.util.invalidateTags([
                'TableData',
                'StorageData',
                'PDiskData',
                {type: 'VDiskData', id: vdiskId},
            ]),
        );
        onClose?.();
    };
    const runtimeItems = fullData ? getRuntimeItems(fullData) : [];
    const storageItems = fullData ? getStorageItems(fullData, capacityMetricsEnabled) : [];
    if (!fullData && data.StoragePoolName) {
        storageItems.push({
            name: i18n('label_storage-pool'),
            content: data.StoragePoolName,
            copyText: data.StoragePoolName,
        });
    }
    const relationItems = fullData ? getRelationItems(fullData, getVDiskLink) : [];
    const pdisk = fullData?.PDisk;
    return (
        <div className={b(null, 'vdisk-storage-popup')}>
            <Flex direction="column" gap={2}>
                <DiskHeader data={fullData} />
                <DiskLocation data={data} nodeData={nodeData} />
                {runtimeItems.length > 0 && (
                    <YDBDefinitionList
                        items={runtimeItems}
                        nameMaxWidth={150}
                        className={b('properties')}
                    />
                )}
                {runtimeItems.length > 0 && storageItems.length > 0 && <Divider />}
                {storageItems.length > 0 && (
                    <YDBDefinitionList
                        items={storageItems}
                        nameMaxWidth={150}
                        className={b('properties')}
                    />
                )}
                {relationItems.length > 0 && (
                    <YDBDefinitionList
                        items={relationItems}
                        nameMaxWidth={150}
                        className={b('properties')}
                    />
                )}
                <DiskFooter data={data} onSuccess={handleAfterEvictVDisk} />
            </Flex>
            {pdisk && isViewerUser && (
                <React.Fragment>
                    <Divider className={b('pdisk-divider')} />
                    <PDiskPopup data={pdisk} nodeData={nodeData} nameMaxWidth={150} />
                </React.Fragment>
            )}
        </div>
    );
}

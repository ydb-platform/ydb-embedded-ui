import React from 'react';

import {ChevronDown, ChevronUp, Wrench} from '@gravity-ui/icons';
import {Button, ClipboardButton, Divider, Flex, Icon, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import {selectNodesMap} from '../../store/reducers/nodesList';
import type {TVDiskID} from '../../types/api/vdisk';
import type {NodeMetadata} from '../../types/store/nodesList';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {parseVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToSpeed, parseOptionalNonNegativeNumber} from '../../utils/utils';
import {EvictVDiskButton, isAllVdiskParamsDefined} from '../EvictVDiskButton/EvictVDiskButton';
import {InternalLink} from '../InternalLink';
import {InternalLinkButton} from '../InternalLinkButton';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {PDiskPopup} from '../PDiskPopup/PDiskPopup';
import {getVDiskCapacityItems, getVDiskLocationItems} from '../VDiskInfo/getVDiskDetails';
import {
    VDiskCompactionRankLabel,
    VDiskDonorLabel,
    VDiskFrontQueuesLabel,
    VDiskReplicationStatus,
    VDiskStateLabel,
    VDiskTypeLabel,
} from '../VDiskStatus';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {vDiskPopupKeyset as i18n} from './i18n';

import './VDiskPopup.scss';

const b = cn('ydb-vdisk-popup');

function DiskLocation({
    data,
    nodeData,
}: {
    data: PreparedVDisk | UnavailableDonor;
    nodeData: NodeMetadata;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const detailsId = React.useId();
    const items = getVDiskLocationItems(data, nodeData);
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

function getRuntimeItems(data: PreparedVDisk): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [
        {
            name: i18n('label_front-queues'),
            content: <VDiskFrontQueuesLabel flag={data.FrontQueues} />,
        },
        {
            name: i18n('label_compaction'),
            content: (
                <Flex direction="column" gap={1} alignItems="flex-start">
                    <VDiskCompactionRankLabel
                        flag={data.SatisfactionRank?.FreshRank?.Flag}
                        rank="fresh"
                    />
                    <VDiskCompactionRankLabel
                        flag={data.SatisfactionRank?.LevelRank?.Flag}
                        rank="level"
                    />
                </Flex>
            ),
        },
    ];
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
    return [...items, ...getVDiskCapacityItems(data, {useWhiteboardSize: capacityMetricsEnabled})];
}

function DiskHeader({data = {}}: {data?: PreparedVDisk}) {
    const {StringifiedId, PDiskType, PDisk, DonorMode} = data;
    const type = PDiskType ?? PDisk?.Type;

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
                <VDiskTypeLabel type={type} />
            </Flex>
            <Flex gap={1} wrap="wrap" alignItems="center">
                <VDiskStateLabel state={data.VDiskState} />
                <VDiskDonorLabel donorMode={DonorMode} />
                <VDiskReplicationStatus data={data} />
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

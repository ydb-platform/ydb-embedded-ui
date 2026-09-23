import React from 'react';

import {Wrench} from '@gravity-ui/icons';
import {Divider, Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import type {TVDiskID} from '../../types/api/vdisk';
import type {NodeMetadata} from '../../types/store/nodesList';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../utils/constants';
import {parseVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedDispatch} from '../../utils/hooks';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useNodeMetadata} from '../../utils/hooks/useNodeMetadata';
import {bytesToSpeed, parseOptionalNonNegativeNumber} from '../../utils/utils';
import {
    DiskPopup,
    DiskPopupHeader,
    DiskPopupLocation,
    DiskPopupPanel,
} from '../DiskPopup/DiskPopup';
import {EvictVDiskButton, isAllVdiskParamsDefined} from '../EvictVDiskButton/EvictVDiskButton';
import {InternalLinkButton} from '../InternalLinkButton';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {PDiskPopupContent} from '../PDiskPopup/PDiskPopup';
import {
    getVDiskCapacityItems,
    getVDiskIdentityItems,
    getVDiskLocationItems,
} from '../VDiskInfo/getVDiskDetails';
import {vDiskInfoKeyset} from '../VDiskInfo/i18n';
import {
    VDiskCompactionRankLabel,
    VDiskDonorLabel,
    VDiskFrontQueuesLabel,
    VDiskReplicationStatus,
    VDiskStateLabel,
} from '../VDiskStatus';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {vDiskPopupKeyset as i18n} from './i18n';

import './VDiskPopup.scss';

const b = cn('ydb-vdisk-popup');

function getRuntimeItems(
    data: PreparedVDisk,
    withUnreadableBlobs: boolean,
): YDBDefinitionListItem[] {
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
    if (withUnreadableBlobs && !isNil(data.HasUnreadableBlobs)) {
        items.push({
            name: vDiskInfoKeyset('has-unreadable-blobs'),
            content: vDiskInfoKeyset(data.HasUnreadableBlobs ? 'yes' : 'no'),
        });
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
    return [...items, ...getVDiskCapacityItems(data, {capacityMetricsEnabled})];
}

function DiskHeader({data = {}}: {data?: PreparedVDisk}) {
    return (
        <DiskPopupHeader
            title={i18n('label_vdisk')}
            id={data.StringifiedId}
            type={data.PDiskType ?? data.PDisk?.Type}
            statuses={
                <React.Fragment>
                    <VDiskStateLabel state={data.VDiskState} />
                    <VDiskReplicationStatus data={data} />
                    <VDiskDonorLabel donorMode={data.DonorMode} />
                </React.Fragment>
            }
        />
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
    withActions,
}: {
    data: PreparedVDisk | UnavailableDonor;
    onSuccess: VoidFunction;
    withActions: boolean;
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
            {withActions && (pageLink || resolvedId) && (
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

interface VDiskPopupProps {
    data: PreparedVDisk | UnavailableDonor;
    nodeData?: NodeMetadata;
    onClose?: VoidFunction;
    view?: 'default' | 'space-distribution';
}

export function VDiskPopup({
    data,
    nodeData: parentNodeData,
    onClose,
    view = 'default',
}: VDiskPopupProps) {
    const dispatch = useTypedDispatch();
    const nodeData = useNodeMetadata(data.NodeId, parentNodeData);
    const isViewerUser = useIsViewerUser();
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
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
    const isSpaceDistribution = view === 'space-distribution';
    const runtimeItems = fullData ? getRuntimeItems(fullData, isSpaceDistribution) : [];
    const identityItems = isSpaceDistribution ? getVDiskIdentityItems(fullData) : [];
    const storageItems = fullData ? getStorageItems(fullData, capacityMetricsEnabled) : [];
    if (!fullData && data.StoragePoolName) {
        storageItems.push({
            name: i18n('label_storage-pool'),
            content: data.StoragePoolName,
            copyText: data.StoragePoolName,
        });
    }
    const pdisk = !isSpaceDistribution && isViewerUser ? fullData?.PDisk : undefined;
    return (
        <DiskPopup combined={Boolean(pdisk)} className={b(null, 'vdisk-storage-popup')}>
            {pdisk && <PDiskPopupContent data={pdisk} nodeData={nodeData} />}
            <DiskPopupPanel
                footer={
                    <DiskFooter
                        data={data}
                        onSuccess={handleAfterEvictVDisk}
                        withActions={!isSpaceDistribution}
                    />
                }
            >
                <DiskHeader data={fullData} />
                <DiskPopupLocation
                    items={getVDiskLocationItems(data, nodeData)}
                    title={i18n('label_vdisk')}
                />
                {runtimeItems.length > 0 && (
                    <YDBDefinitionList items={runtimeItems} nameMaxWidth={150} />
                )}
                {runtimeItems.length > 0 && storageItems.length > 0 && <Divider />}
                {storageItems.length > 0 && (
                    <YDBDefinitionList items={storageItems} nameMaxWidth={150} />
                )}
                {identityItems.length > 0 && (
                    <React.Fragment>
                        <Divider />
                        <YDBDefinitionList items={identityItems} nameMaxWidth={150} />
                    </React.Fragment>
                )}
            </DiskPopupPanel>
        </DiskPopup>
    );
}

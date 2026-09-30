import React from 'react';

import {Wrench} from '@gravity-ui/icons';
import {Divider, Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import type {TVDiskID} from '../../types/api/vdisk';
import type {NodeMetadata} from '../../types/store/nodesList';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {parseVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedDispatch} from '../../utils/hooks';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useNodeMetadata} from '../../utils/hooks/useNodeMetadata';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {getVDiskCapacityItems} from '../DiskCapacityInfo/DiskCapacityInfo';
import {
    DiskPopup,
    DiskPopupHeader,
    DiskPopupLocation,
    DiskPopupPanel,
    DiskPopupText,
} from '../DiskPopup/DiskPopup';
import {EvictVDiskButton, isAllVdiskParamsDefined} from '../EvictVDiskButton/EvictVDiskButton';
import {InternalLinkButton} from '../InternalLinkButton';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {PDiskPopupContent} from '../PDiskPopup/PDiskPopup';
import {getVDiskIdentityItems, getVDiskLocationItems} from '../VDiskInfo/getVDiskDetails';
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

import {vDiskPopupKeyset} from './i18n';

import './VDiskPopup.scss';

const b = cn('ydb-vdisk-popup');

function buildUnavailableVDiskFooter(
    data: UnavailableDonor,
    withDeveloperUILink: boolean,
): React.ReactNode | null {
    const {NodeId, PDiskId, VDiskSlotId} = data;
    if (!withDeveloperUILink || isNil(NodeId) || isNil(PDiskId) || isNil(VDiskSlotId)) {
        return null;
    }
    const vDiskInternalViewerPath = createVDiskDeveloperUILink({
        nodeId: NodeId,
        pDiskId: PDiskId,
        vDiskSlotId: VDiskSlotId,
    });
    return (
        <LinkWithIcon
            title={vDiskPopupKeyset('action_open-in-developer-ui')}
            url={vDiskInternalViewerPath}
            icon={Wrench}
            hideEndIcon
        />
    );
}

function getRuntimeItems(
    data: PreparedVDisk,
    withUnreadableBlobs: boolean,
): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [
        {
            name: vDiskPopupKeyset('label_front-queues'),
            content: <VDiskFrontQueuesLabel flag={data.FrontQueues} />,
        },
        {
            name: vDiskPopupKeyset('label_compaction'),
            content: (
                <Flex
                    direction="column"
                    gap={1}
                    alignItems="flex-start"
                    className={b('compaction')}
                >
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
        [vDiskPopupKeyset('label_read'), data.ReadThroughput],
        [vDiskPopupKeyset('label_write'), data.WriteThroughput],
    ] as const) {
        const throughput = parseOptionalNonNegativeNumber(value);
        items.push({
            name,
            content:
                throughput === undefined
                    ? EMPTY_DATA_PLACEHOLDER
                    : formatBytes({
                          value: throughput,
                          size: 'mb',
                          fixedDecimalPlaces: 2,
                          withSpeedLabel: true,
                      }),
        });
    }
    if (withUnreadableBlobs) {
        items.push({
            name: vDiskInfoKeyset('has-unreadable-blobs'),
            content: isNil(data.HasUnreadableBlobs)
                ? EMPTY_DATA_PLACEHOLDER
                : vDiskInfoKeyset(data.HasUnreadableBlobs ? 'yes' : 'no'),
        });
    }
    return items;
}

function getStorageItems(
    data: PreparedVDisk,
    capacityMetricsEnabled: boolean,
): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [
        {
            name: vDiskPopupKeyset('label_storage-pool'),
            content: <DiskPopupText value={data.StoragePoolName} />,
            copyText: data.StoragePoolName,
        },
    ];
    return isFullVDiskData(data)
        ? [...items, ...getVDiskCapacityItems(data, {capacityMetricsEnabled})]
        : items;
}

function getLocationItems(data: PreparedVDisk, nodeData: NodeMetadata, withPDiskPanel: boolean) {
    const items = getVDiskLocationItems(data, nodeData);
    if (!withPDiskPanel) {
        return items;
    }
    return items.filter(({id}) => id !== 'pdisk-id' && id !== 'pdisk-path');
}

function DiskHeader({
    data = {},
    donorMode,
    withPDiskType = true,
}: {
    data?: PreparedVDisk;
    donorMode?: boolean;
    withPDiskType?: boolean;
}) {
    return (
        <DiskPopupHeader
            title={vDiskPopupKeyset('label_vdisk')}
            id={data.StringifiedId}
            type={withPDiskType ? (data.PDiskType ?? data.PDisk?.Type) : undefined}
            statuses={
                <React.Fragment>
                    <VDiskStateLabel state={data.VDiskState} size="xs" />
                    <VDiskReplicationStatus data={data} size="xs" />
                    <VDiskDonorLabel donorMode={donorMode} size="xs" />
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

function buildVDiskFooter(
    data: PreparedVDisk,
    withDeveloperUILink: boolean,
    getVDiskLinkFn: ReturnType<typeof useVDiskPagePath>,
    onSuccess: VoidFunction,
    withActions: boolean,
): React.ReactNode | null {
    const {NodeId, PDiskId, VDiskSlotId, StringifiedId, DonorMode} = data;
    const vDiskInternalViewerPath =
        withDeveloperUILink && !isNil(NodeId) && !isNil(PDiskId) && !isNil(VDiskSlotId)
            ? createVDiskDeveloperUILink({
                  nodeId: NodeId,
                  pDiskId: PDiskId,
                  vDiskSlotId: VDiskSlotId,
              })
            : undefined;
    const vDiskPagePath =
        withActions && withDeveloperUILink && !isNil(NodeId) && StringifiedId
            ? getVDiskLinkFn({nodeId: NodeId, vDiskId: StringifiedId})
            : undefined;
    const resolvedVDiskId = withActions ? resolveVDiskId(data) : undefined;
    if (!vDiskInternalViewerPath && !vDiskPagePath && !resolvedVDiskId) {
        return null;
    }
    return (
        <React.Fragment>
            {vDiskInternalViewerPath && (
                <LinkWithIcon
                    title={vDiskPopupKeyset('action_open-in-developer-ui')}
                    url={vDiskInternalViewerPath}
                    icon={Wrench}
                    hideEndIcon
                />
            )}
            {(vDiskPagePath || resolvedVDiskId) && (
                <Flex gap={2} wrap="wrap" className={b('actions')}>
                    {vDiskPagePath && (
                        <InternalLinkButton
                            href={vDiskPagePath}
                            view="action"
                            size="m"
                            className={BRAND_BUTTON_CLASS}
                        >
                            {vDiskPopupKeyset('action_go-to-vdisk')}
                        </InternalLinkButton>
                    )}
                    {resolvedVDiskId && (
                        <EvictVDiskButton
                            vDiskId={resolvedVDiskId}
                            donorMode={DonorMode}
                            onSuccess={onSuccess}
                        />
                    )}
                </Flex>
            )}
        </React.Fragment>
    );
}

interface VDiskPopupProps {
    data: PreparedVDisk;
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
    const hasDeveloperUi = useHasDeveloperUi();
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
    const isSpaceDistribution = view === 'space-distribution';
    const runtimeItems = fullData ? getRuntimeItems(fullData, isSpaceDistribution) : [];
    const identityItems = isSpaceDistribution ? getVDiskIdentityItems(fullData) : [];
    const storageItems = getStorageItems(data, capacityMetricsEnabled);
    const pdisk = !isSpaceDistribution && isViewerUser ? fullData?.PDisk : undefined;
    const vdiskFooter = isFullVDiskData(data)
        ? buildVDiskFooter(
              data,
              hasDeveloperUi,
              getVDiskLink,
              handleAfterEvictVDisk,
              !isSpaceDistribution,
          )
        : buildUnavailableVDiskFooter(data, hasDeveloperUi);
    const locationItems = getLocationItems(data, nodeData, Boolean(pdisk));
    return (
        <DiskPopup combined={Boolean(pdisk)} className={b(null, 'vdisk-storage-popup')}>
            {pdisk && <PDiskPopupContent data={pdisk} nodeData={nodeData} />}
            <DiskPopupPanel footer={vdiskFooter}>
                <DiskHeader data={fullData} donorMode={data.DonorMode} withPDiskType={!pdisk} />
                <DiskPopupLocation items={locationItems} />
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

import React from 'react';

import {Button, Flex, Text} from '@gravity-ui/uikit';

import {getClusterPath} from '../../routes';
import type {DDiskComponentStatus, TDDiskStateInfo} from '../../types/api/ddisk';
import type {TPDiskState} from '../../types/api/pdisk';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {getDDiskDeveloperUIHrefs} from '../../utils/developerUI/ddisk';
import {useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {getStateSeverity} from '../../utils/disks/calculatePDiskSeverity';
import {DATA_SEVERITY} from '../../utils/disks/constants';
import {useNbsStorageAvailability} from '../../utils/hooks/useNbsStorageAvailability';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink/InternalLink';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {i18n} from './i18n';

import './DDisk.scss';

const b = cn('ydb-ddisk');
const percent = (value?: number) =>
    value === undefined || !Number.isFinite(value)
        ? EMPTY_DATA_PLACEHOLDER
        : `${(value * 100).toFixed(1)}%`;
const bytes = (value?: string) =>
    value === undefined ? EMPTY_DATA_PLACEHOLDER : formatBytes({value});

function formatHealth(status?: DDiskComponentStatus, reason?: string) {
    const labels = {
        Ready: i18n('state_ready'),
        Initializing: i18n('state_initializing'),
        Broken: i18n('state_broken'),
        Stopping: i18n('state_stopping'),
    };
    const label = (status && labels[status]) || i18n('state_unknown');
    return reason ? `${label} (${reason})` : label;
}

function DDiskInventoryLink({nodeId, pDiskId}: {nodeId: number; pDiskId: number}) {
    const available = useNbsStorageAvailability();
    if (!available) {
        return null;
    }

    return (
        <InternalLink
            to={getClusterPath(
                {activeTab: 'storage'},
                {type: 'ddisks', ddisksNodeId: nodeId, ddisksPDiskId: pDiskId},
            )}
        >
            {i18n('action_inventory')}
        </InternalLink>
    );
}

export function DDiskInfo({
    data,
    failureDescription,
    showInventoryLink,
}: {
    data: TDDiskStateInfo;
    failureDescription?: string;
    showInventoryLink?: boolean;
}) {
    const hasDeveloperUi = useHasDeveloperUi();
    const links = getDDiskDeveloperUIHrefs(data);
    return (
        <Flex direction="column" gap={3} className={b('popup')}>
            <Text variant="subheader-2">DDisk {data.DDiskSlotId}</Text>
            {failureDescription && <Text>{failureDescription}</Text>}
            {data.HasWhiteboardData === false && <Text>{i18n('label_unavailable')}</Text>}
            <YDBDefinitionList
                items={[
                    {
                        name: i18n('label_pool'),
                        content: data.StoragePoolName || EMPTY_DATA_PLACEHOLDER,
                    },
                    {name: i18n('label_node'), content: data.NodeId ?? EMPTY_DATA_PLACEHOLDER},
                    {name: i18n('label_pdisk'), content: data.PDiskId ?? EMPTY_DATA_PLACEHOLDER},
                    {name: i18n('label_slot'), content: data.DDiskSlotId ?? EMPTY_DATA_PLACEHOLDER},
                    {
                        name: i18n('label_ddisk-state'),
                        content: formatHealth(data.DDiskStatus, data.DDiskStatusReason),
                    },
                    {
                        name: i18n('label_buffer-state'),
                        content: formatHealth(
                            data.PersistentBufferStatus,
                            data.PersistentBufferStatusReason,
                        ),
                    },
                    {name: i18n('label_used'), content: bytes(data.AllocatedSize)},
                    {name: i18n('label_available'), content: bytes(data.AvailableSize)},
                    {name: i18n('label_total'), content: bytes(data.TotalSize)},
                    {name: i18n('label_occupancy'), content: percent(data.DDiskOccupancy)},
                    {
                        name: i18n('label_buffer-occupancy'),
                        content: percent(data.PersistentBufferOccupancy),
                    },
                ]}
            />
            {showInventoryLink && data.NodeId !== undefined && data.PDiskId !== undefined && (
                <DDiskInventoryLink nodeId={data.NodeId} pDiskId={data.PDiskId} />
            )}
            {hasDeveloperUi && data.NodeId !== undefined && (
                <Flex gap={2}>
                    <Button
                        href={links.ddisk}
                        disabled={!links.ddisk}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {i18n('action_ddisk')}
                    </Button>
                    <Button
                        href={links.buffer}
                        disabled={!links.buffer}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {data.PersistentBufferId || EMPTY_DATA_PLACEHOLDER}
                    </Button>
                </Flex>
            )}
        </Flex>
    );
}

export function DDisk({
    data,
    compact = false,
    pDiskState,
    unavailable = false,
    role,
    showInventoryLink,
}: {
    data: TDDiskStateInfo;
    compact?: boolean;
    pDiskState?: TPDiskState;
    unavailable?: boolean;
    role?: 'ddisk' | 'buffer';
    showInventoryLink?: boolean;
}) {
    const [focused, setFocused] = React.useState(false);
    const slotAddress = `${data.NodeId}:${data.PDiskId}:${data.DDiskSlotId}`;
    const label = `${role === 'buffer' ? 'Persistent Buffer' : 'DDisk'} ${slotAddress}`;
    const missingSample = data.HasWhiteboardData === false;
    const pDiskFailed = getStateSeverity(pDiskState) === DATA_SEVERITY.RED;
    const ddiskHealth = {Status: data.DDiskStatus, Reason: data.DDiskStatusReason};
    const bufferHealth = {
        Status: data.PersistentBufferStatus,
        Reason: data.PersistentBufferStatusReason,
    };
    const health = role
        ? [role === 'buffer' ? bufferHealth : ddiskHealth]
        : [ddiskHealth, bufferHealth];
    const failed =
        pDiskFailed ||
        unavailable ||
        health.some(({Status}) => Status === 'Broken' || Status === 'Stopping');
    const failureDescription = pDiskFailed
        ? i18n('label_failed')
        : unavailable
          ? i18n('label_slot-unavailable')
          : undefined;
    const healthDescription = health
        .filter(({Status}) => role !== undefined || Status !== undefined)
        .map(({Status, Reason}) => formatHealth(Status, Reason))
        .join(', ');
    const description =
        [failureDescription, healthDescription, missingSample && i18n('label_unavailable')]
            .filter(Boolean)
            .join('. ') || undefined;
    return (
        <HoverPopup
            renderPopupContent={() => (
                <DDiskInfo
                    data={data}
                    failureDescription={failureDescription}
                    showInventoryLink={showInventoryLink}
                />
            )}
            placement={['right', 'top']}
            showPopup={focused}
        >
            <button
                type="button"
                className={b({compact, unavailable: missingSample, failed})}
                aria-label={label}
                aria-description={description}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setFocused(false);
                    }
                }}
            >
                {!compact && `DDisk ${data.DDiskSlotId}: ${percent(data.DDiskOccupancy)}`}
            </button>
        </HoverPopup>
    );
}

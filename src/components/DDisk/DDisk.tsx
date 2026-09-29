import React from 'react';

import {Button, Flex, Text} from '@gravity-ui/uikit';

import type {TDDiskStateInfo} from '../../types/api/ddisk';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    createDeveloperUILinkWithNodeId,
    useHasDeveloperUi,
} from '../../utils/developerUI/developerUI';
import {HoverPopup} from '../HoverPopup/HoverPopup';
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

export function DDiskInfo({data}: {data: TDDiskStateInfo}) {
    const hasDeveloperUi = useHasDeveloperUi();
    const base =
        data.NodeId === undefined ? undefined : createDeveloperUILinkWithNodeId(data.NodeId);
    const query = new URLSearchParams({
        formPresent: '1',
        autoRefresh: '1',
        describeFreeSpace: '1',
        showTablets: '1',
        refreshRate: '1',
        pb: data.PersistentBufferId ?? '',
    });
    return (
        <Flex direction="column" gap={3} className={b('popup')}>
            <Text variant="subheader-2">DDisk {data.DDiskSlotId}</Text>
            {data.HasWhiteboardData === false && <Text>{i18n('label_unavailable')}</Text>}
            <YDBDefinitionList
                items={[
                    {name: i18n('label_node'), content: data.NodeId ?? EMPTY_DATA_PLACEHOLDER},
                    {name: i18n('label_pdisk'), content: data.PDiskId ?? EMPTY_DATA_PLACEHOLDER},
                    {name: i18n('label_slot'), content: data.DDiskSlotId ?? EMPTY_DATA_PLACEHOLDER},
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
            {hasDeveloperUi && base && (
                <Flex gap={2}>
                    <Button
                        href={data.DDiskPath ? `${base}/${data.DDiskPath}` : undefined}
                        disabled={!data.DDiskPath}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {i18n('action_ddisk')}
                    </Button>
                    <Button
                        href={
                            data.PersistentBufferId
                                ? `${base}/actors/persistent_buffer?${query}`
                                : undefined
                        }
                        disabled={!data.PersistentBufferId}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {i18n('action_buffer')}
                    </Button>
                </Flex>
            )}
        </Flex>
    );
}

export function DDisk({data, compact = false}: {data: TDDiskStateInfo; compact?: boolean}) {
    const [focused, setFocused] = React.useState(false);
    const label = `DDisk ${data.NodeId}:${data.PDiskId}:${data.DDiskSlotId}`;
    return (
        <HoverPopup
            renderPopupContent={() => <DDiskInfo data={data} />}
            placement={['right', 'top']}
            showPopup={focused}
        >
            <button
                type="button"
                className={b({compact, unavailable: data.HasWhiteboardData === false})}
                aria-label={label}
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

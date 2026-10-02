import React from 'react';

import {Button, Flex, Text} from '@gravity-ui/uikit';

import type {TDDiskStateInfo} from '../../types/api/ddisk';
import type {TPDiskState} from '../../types/api/pdisk';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {getDDiskDeveloperUIHrefs} from '../../utils/developerUI/ddisk';
import {useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {getStateSeverity} from '../../utils/disks/calculatePDiskSeverity';
import {DATA_SEVERITY} from '../../utils/disks/constants';
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
    const links = getDDiskDeveloperUIHrefs(data);
    return (
        <Flex direction="column" gap={3} className={b('popup')}>
            <Text variant="subheader-2">DDisk {data.DDiskSlotId}</Text>
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
}: {
    data: TDDiskStateInfo;
    compact?: boolean;
    pDiskState?: TPDiskState;
}) {
    const [focused, setFocused] = React.useState(false);
    const label = `DDisk ${data.NodeId}:${data.PDiskId}:${data.DDiskSlotId}`;
    const unavailable = data.HasWhiteboardData === false;
    const failed = getStateSeverity(pDiskState) === DATA_SEVERITY.RED;
    let description;
    if (unavailable) {
        description = i18n('label_unavailable');
    } else if (failed) {
        description = i18n('label_failed');
    }
    return (
        <HoverPopup
            renderPopupContent={() => <DDiskInfo data={data} />}
            placement={['right', 'top']}
            showPopup={focused}
        >
            <button
                type="button"
                className={b({compact, unavailable, failed: unavailable || failed})}
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

import React from 'react';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import type {InfoViewerItem} from '../../../components/InfoViewer';
import {InfoViewer} from '../../../components/InfoViewer';
import {InternalLink} from '../../../components/InternalLink';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {VDiskInfo} from '../../../components/VDiskInfo/VDiskInfo';
import {useVDiskPagePath} from '../../../routes';
import type {
    EmptySlotData,
    LogSlotData,
    PDiskData,
    SlotItem,
    SlotItemType,
} from '../../../store/reducers/pdisk/types';
import {valueIsDefined} from '../../../utils';
import {formatBytes} from '../../../utils/bytesParsers';
import {cn} from '../../../utils/cn';
import {formatStorageValuesToGb} from '../../../utils/dataFormatters/dataFormatters';
import {pDiskPageKeyset} from '../i18n';

import {isEmptySlot, isLogSlot, isVDiskSlot} from './utils';

import './PDiskSpaceDistribution.scss';

const b = cn('ydb-pdisk-space-distribution');

const BASE_SLOT_HEIGHT = 40;
// Upper bound for how much a single slot can be scaled relative to the smallest one.
// Protects layout from degenerate cases where a VDisk reports an implausibly small Total
// (e.g. a mostly empty disk where Total falls back to AllocatedSize), which would otherwise
// blow up other slots' heights to thousands of pixels.
const MAX_SLOT_HEIGHT_MULTIPLIER = 10;

interface PDiskSpaceDistributionProps {
    data: PDiskData;
}

export function PDiskSpaceDistribution({data}: PDiskSpaceDistributionProps) {
    const getVDiskPagePath = useVDiskPagePath();
    const {SlotItems} = data;

    const {PDiskId, NodeId} = data;

    // Find the minimum Total among non-log slots to use as the base unit for height scaling.
    // Slots with missing/zero Total are skipped so that they don't collapse the base unit to 1
    // and inflate every other slot's computed height to an unrenderable value.
    const minNonLogTotal = React.useMemo(() => {
        if (!SlotItems?.length) {
            return 1;
        }

        let minTotal = Infinity;

        for (const item of SlotItems) {
            if (item.SlotType === 'log') {
                continue;
            }
            const value = Number(item.Total);
            if (!value || value <= 0) {
                continue;
            }
            if (value < minTotal) {
                minTotal = value;
            }
        }

        return minTotal === Infinity ? 1 : minTotal;
    }, [SlotItems]);

    const renderSlots = () => {
        return SlotItems?.map((item, index) => {
            return (
                <Slot
                    item={item}
                    minNonLogTotal={minNonLogTotal}
                    pDiskId={PDiskId}
                    nodeId={NodeId}
                    getVDiskPagePath={getVDiskPagePath}
                    key={index}
                />
            );
        });
    };

    if (!SlotItems?.length) {
        return pDiskPageKeyset('no-slots-data');
    }

    return (
        <div className={b(null)}>
            <DiskStateProgressBar
                className={b('pdisk-bar')}
                severity={data.Severity}
                diskAllocatedPercent={data.AllocatedPercent}
                content={renderSlots()}
                faded={true}
            />
        </div>
    );
}

interface SlotProps<T extends SlotItemType> {
    item: SlotItem<T>;
    minNonLogTotal: number;

    pDiskId?: string | number;
    nodeId?: string | number;
    getVDiskPagePath?: (
        params: {nodeId: string | number | undefined; vDiskId: string | undefined},
        query?: {activeTab?: string},
    ) => string | undefined;
}

function getSlotHeight<T extends SlotItemType>(item: SlotItem<T>, minNonLogTotal: number) {
    // Log slots get a fixed half-height.
    if (item.SlotType === 'log') {
        return BASE_SLOT_HEIGHT / 2;
    }
    // Slots with a missing/non-numeric/zero Total fall back to BASE_SLOT_HEIGHT so they
    // stay visible and never produce NaN in the inline style.
    // Same falsy-check pattern as in minNonLogTotal: catches NaN, 0, undefined, null.
    const totalValue = Number(item.Total);
    if (!totalValue || totalValue < 0) {
        return BASE_SLOT_HEIGHT;
    }
    // Others scale proportionally to the smallest non-log slot, clamped from above so an
    // implausibly small Total can't blow up other slots' heights.
    const multiplier = Math.min(totalValue / minNonLogTotal, MAX_SLOT_HEIGHT_MULTIPLIER);
    return multiplier * BASE_SLOT_HEIGHT;
}

function Slot<T extends SlotItemType>({
    item,
    minNonLogTotal,
    nodeId,
    getVDiskPagePath,
}: SlotProps<T>) {
    const renderContent = () => {
        if (isVDiskSlot(item)) {
            const vDiskPagePath = getVDiskPagePath?.({
                nodeId,
                vDiskId: item.SlotData.StringifiedId,
            });

            return (
                <HoverPopup
                    renderPopupContent={() => <VDiskInfo data={item.SlotData} withTitle />}
                    contentClassName={b('vdisk-popup')}
                    placement={['right', 'top']}
                >
                    <InternalLink to={vDiskPagePath}>
                        <DiskStateProgressBar
                            className={b('slot')}
                            severity={item.Severity}
                            diskAllocatedPercent={item.UsagePercent}
                            content={
                                <SlotContent
                                    id={item.Id}
                                    title={item.Title}
                                    used={item.Used}
                                    total={item.Total}
                                />
                            }
                        />
                    </InternalLink>
                </HoverPopup>
            );
        }
        if (isLogSlot(item)) {
            return (
                <HoverPopup
                    renderPopupContent={() => <LogInfo data={item.SlotData} />}
                    contentClassName={b('vdisk-popup')}
                    placement={['right', 'top']}
                >
                    <DiskStateProgressBar
                        className={b('slot')}
                        severity={item.Severity}
                        diskAllocatedPercent={item.UsagePercent}
                        content={
                            <SlotContent
                                title={pDiskPageKeyset('log')}
                                used={item.Used}
                                total={item.Total}
                            />
                        }
                    />
                </HoverPopup>
            );
        }

        if (isEmptySlot(item)) {
            return (
                <HoverPopup
                    renderPopupContent={() => <EmptySlotInfo data={item.SlotData} />}
                    contentClassName={b('vdisk-popup')}
                    placement={['right', 'top']}
                >
                    <DiskStateProgressBar
                        className={b('slot')}
                        severity={item.Severity}
                        empty
                        content={
                            <SlotContent
                                title={pDiskPageKeyset('empty-slot')}
                                // Empty slots have only total size
                                used={item.Total}
                            />
                        }
                    />
                </HoverPopup>
            );
        }

        return null;
    };

    const slotHeight = getSlotHeight(item, minNonLogTotal);

    return (
        <div className={b('slot-wrapper')} style={{height: slotHeight}}>
            {renderContent()}
        </div>
    );
}

interface SlotContentProps {
    id?: string | number;
    title?: string;
    used?: number;
    total?: number;
}

function SlotContent({id, title, used, total}: SlotContentProps) {
    const renderSize = () => {
        const [formattedUsed, formattedTotal] = formatStorageValuesToGb(used, total);

        if (!total) {
            return formattedUsed;
        }

        return `${formattedUsed} / ${formattedTotal}`;
    };

    return (
        <div className={b('slot-content')}>
            <span>
                {valueIsDefined(id) ? <span className={b('slot-id')}>{id}</span> : null}
                {title}
            </span>
            <span className={b('slot-size')}>{renderSize()}</span>
        </div>
    );
}

interface LogInfoProps {
    data: LogSlotData;
}

function LogInfo({data}: LogInfoProps) {
    const {LogTotalSize, LogUsedSize, SystemSize} = data;

    const info: InfoViewerItem[] = [
        {
            label: pDiskPageKeyset('label.log-size'),
            value: (
                <ProgressViewer
                    value={LogUsedSize}
                    capacity={LogTotalSize}
                    formatValues={formatStorageValuesToGb}
                />
            ),
        },
    ];

    if (valueIsDefined(SystemSize)) {
        info.push({
            label: pDiskPageKeyset('label.system-size'),
            value: formatBytes({value: SystemSize}),
        });
    }

    return <InfoViewer title={pDiskPageKeyset('log')} info={info} />;
}

interface EmptySlotInfoProps {
    data: EmptySlotData;
}

function EmptySlotInfo({data}: EmptySlotInfoProps) {
    const {Size} = data;

    const info: InfoViewerItem[] = [
        {
            label: pDiskPageKeyset('label.slot-size'),
            value: formatBytes({value: Size}),
        },
    ];

    return <InfoViewer title={pDiskPageKeyset('empty-slot')} info={info} />;
}

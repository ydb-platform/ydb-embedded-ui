import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../components/InternalLink';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {VDiskInfo} from '../../../components/VDiskInfo/VDiskInfo';
import type {YDBDefinitionListItem} from '../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../components/YDBDefinitionList/YDBDefinitionList';
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
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../../utils/disks/constants';
import {pDiskPageKeyset} from '../i18n';

import {isEmptySlot, isLogSlot, isVDiskSlot} from './utils';

import './PDiskSpaceDistribution.scss';

const b = cn('ydb-pdisk-space-distribution');

const SLOT_HEIGHT = 40;

interface PDiskSpaceDistributionProps {
    data: PDiskData;
}

export function PDiskSpaceDistribution({data}: PDiskSpaceDistributionProps) {
    const getVDiskPagePath = useVDiskPagePath();
    const {SlotItems} = data;

    const {PDiskId, NodeId} = data;

    const containerHeight = SLOT_HEIGHT * (SlotItems?.length || 1);

    const renderSlots = () => {
        return SlotItems?.map((item, index) => {
            return (
                <Slot
                    item={item}
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
        <div
            className={b(null)}
            style={{
                height: containerHeight,
                minHeight: containerHeight,
            }}
        >
            <DiskStateProgressBar
                className={b('pdisk-bar')}
                severity={data.Severity}
                diskAllocatedPercent={data.AllocatedPercent}
                content={renderSlots()}
                faded={true}
                noDataPlaceholder={pDiskPageKeyset('no-slots-data')}
            />
        </div>
    );
}

interface SlotProps<T extends SlotItemType> {
    item: SlotItem<T>;

    pDiskId?: string | number;
    nodeId?: string | number;
    getVDiskPagePath?: (
        params: {nodeId: string | number | undefined; vDiskId: string | undefined},
        query?: {activeTab?: string},
    ) => string | undefined;
}

function Slot<T extends SlotItemType>({item, nodeId, getVDiskPagePath}: SlotProps<T>) {
    const renderContent = () => {
        if (isVDiskSlot(item)) {
            const vDiskPagePath = getVDiskPagePath?.({
                nodeId,
                vDiskId: item.SlotData.StringifiedId,
            });

            const isReplicatingColor = item.Severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
            const isDonor = item.SlotData.DonorMode;

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
                            striped={isReplicatingColor || isDonor}
                            isDonor={isDonor}
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

    return (
        <div className={b('slot-wrapper')} style={{flexGrow: Number(item.Total) || 1}}>
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

    const items: YDBDefinitionListItem[] = [
        {
            name: pDiskPageKeyset('label.log-size'),
            content: (
                <ProgressViewer
                    value={LogUsedSize}
                    capacity={LogTotalSize}
                    formatValues={formatStorageValuesToGb}
                />
            ),
        },
    ];

    if (valueIsDefined(SystemSize)) {
        items.push({
            name: pDiskPageKeyset('label.system-size'),
            content: formatBytes({value: SystemSize}),
        });
    }

    return <YDBDefinitionList title={pDiskPageKeyset('log')} items={items} />;
}

interface EmptySlotInfoProps {
    data: EmptySlotData;
}

function EmptySlotInfo({data}: EmptySlotInfoProps) {
    const {Size} = data;

    const items: YDBDefinitionListItem[] = [
        {
            name: pDiskPageKeyset('label.slot-size'),
            content: formatBytes({value: Size}),
        },
    ];

    return <YDBDefinitionList title={pDiskPageKeyset('empty-slot')} items={items} />;
}

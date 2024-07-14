import {ContentWithPopup} from '../../../components/ContentWithPopup/ContentWithPopup';
import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../../../components/InternalLink';
import {VDiskInfo} from '../../../components/VDiskInfo/VDiskInfo';
import {getVDiskPagePath} from '../../../routes';
import type {PDiskData, SlotItem} from '../../../store/reducers/pdisk/types';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import {formatStorageValues} from '../../../utils/dataFormatters/dataFormatters';
import {pDiskPageKeyset} from '../i18n';

import './PDiskSpaceDistribution.scss';

const b = cn('ydb-pdisk-space-distribution');

const SLOT_HEIGHT = 40;

interface PDiskSpaceDistributionProps {
    data: PDiskData;
}

export function PDiskSpaceDistribution({data}: PDiskSpaceDistributionProps) {
    const {SlotItems} = data;

    const {PDiskId, NodeId} = data;

    const containerHeight = SLOT_HEIGHT * (SlotItems?.length || 1);

    const renderSlots = () => {
        return SlotItems?.map((item, index) => {
            return <Slot item={item} pDiskId={PDiskId} nodeId={NodeId} key={index} />;
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
            />
        </div>
    );
}

interface SlotProps {
    item: SlotItem;

    pDiskId?: string | number;
    nodeId?: string | number;
}

function Slot({item, pDiskId, nodeId}: SlotProps) {
    const {SlotType, Id, Title, Severity, Used, Total, UsagePercent, VDiskData} = item;

    const renderContent = () => {
        if (SlotType === 'vDisk') {
            const vDiskPagePath =
                valueIsDefined(VDiskData?.VDiskSlotId) &&
                valueIsDefined(pDiskId) &&
                valueIsDefined(nodeId)
                    ? getVDiskPagePath(VDiskData.VDiskSlotId, pDiskId, nodeId)
                    : undefined;

            return (
                <ContentWithPopup
                    content={<VDiskInfo data={VDiskData} withTitle />}
                    contentClassName={b('vdisk-popup')}
                    placement={['right']}
                >
                    <InternalLink to={vDiskPagePath}>
                        <DiskStateProgressBar
                            className={b('slot')}
                            severity={Severity}
                            diskAllocatedPercent={UsagePercent}
                            content={
                                <SlotContent id={Id} title={Title} used={Used} total={Total} />
                            }
                        />
                    </InternalLink>
                </ContentWithPopup>
            );
        }
        if (item.SlotType === 'log') {
            return (
                <DiskStateProgressBar
                    className={b('slot')}
                    severity={1}
                    diskAllocatedPercent={UsagePercent}
                    content={
                        <SlotContent title={pDiskPageKeyset('log')} used={Used} total={Total} />
                    }
                />
            );
        }

        return (
            <DiskStateProgressBar
                className={b('slot')}
                severity={1}
                empty
                content={
                    <SlotContent
                        title={pDiskPageKeyset('empty-slot')}
                        // Empty slots have only total size
                        used={Total}
                    />
                }
            />
        );
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
        const [formattedUsed, formattedTotal] = formatStorageValues(used, total, 'gb');

        if (!total) {
            return formattedUsed;
        }

        return `${formattedUsed} / ${formattedTotal}`;
    };

    return (
        <div className={b('slot-content')}>
            <span>
                {id ? <span className={b('slot-id')}>{id}</span> : null}
                {title}
            </span>
            <span className={b('slot-size')}>{renderSize()}</span>
        </div>
    );
}

import {useState} from 'react';
import cn from 'bem-cn-lite';
import {isEmpty} from 'lodash/fp';

import {ArrowToggle, Button, Popover} from '@gravity-ui/uikit';

import DataTable, {type Column} from '@gravity-ui/react-data-table';

import type {ValueOf} from '../../../types/common';
import type {
    PreparedStructurePDisk,
    PreparedStructureVDisk,
} from '../../../store/reducers/node/types';
import {EVDiskState} from '../../../types/api/vdisk';
import {bytesToGB} from '../../../utils/utils';
import {formatStorageValuesToGb} from '../../../utils/dataFormatters/dataFormatters';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {
    createPDiskDeveloperUILink,
    createVDiskDeveloperUILink,
} from '../../../utils/developerUI/developerUI';
import EntityStatus from '../../../components/EntityStatus/EntityStatus';
import InfoViewer, {type InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {Icon} from '../../../components/Icon';

import i18n from '../i18n';
import {Vdisk} from './Vdisk';
import {valueIsDefined} from './NodeStructure';
import {PDiskTitleBadge} from './PDiskTitleBadge';

const b = cn('kv-node-structure');

interface PDiskProps {
    data: PreparedStructurePDisk;
    unfolded?: boolean;
    id: string;
    selectedVdiskId?: string;
    nodeId: string | number;
}

enum VDiskTableColumnsIds {
    slotId = 'VDiskSlotId',
    VDiskState = 'VDiskState',
    Size = 'Size',
    Info = 'Info',
}

type VDiskTableColumnsIdsValues = ValueOf<typeof VDiskTableColumnsIds>;

const vDiskTableColumnsNames: Record<VDiskTableColumnsIdsValues, string> = {
    VDiskSlotId: 'Slot id',
    VDiskState: 'Status',
    Size: 'Size',
    Info: '',
};

function getColumns({
    pDiskId,
    selectedVdiskId,
    nodeId,
}: {
    pDiskId: number | undefined;
    selectedVdiskId?: string;
    nodeId?: string | number;
}) {
    const columns: Column<PreparedStructureVDisk>[] = [
        {
            name: VDiskTableColumnsIds.slotId,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.slotId],
            width: 100,
            render: ({row}) => {
                const vDiskSlotId = row.VDiskSlotId;
                let vdiskInternalViewerLink = null;

                if (
                    valueIsDefined(nodeId) &&
                    valueIsDefined(pDiskId) &&
                    valueIsDefined(vDiskSlotId)
                ) {
                    vdiskInternalViewerLink = createVDiskDeveloperUILink({
                        nodeId,
                        pDiskId,
                        vDiskSlotId,
                    });
                }

                return (
                    <div className={b('vdisk-id', {selected: row.id === selectedVdiskId})}>
                        <span>{vDiskSlotId}</span>
                        {vdiskInternalViewerLink && (
                            <Button
                                size="s"
                                className={b('external-button', {hidden: true})}
                                href={vdiskInternalViewerLink}
                                target="_blank"
                                title={i18n('vdisk.developer-ui-button-title')}
                            >
                                <Icon name="external" />
                            </Button>
                        )}
                    </div>
                );
            },
            align: DataTable.LEFT,
        },
        {
            name: VDiskTableColumnsIds.VDiskState,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.VDiskState],
            width: 70,
            render: ({row}) => {
                return (
                    <EntityStatus status={row.VDiskState === EVDiskState.OK ? 'green' : 'red'} />
                );
            },
            sortAccessor: (row) => (row.VDiskState === EVDiskState.OK ? 1 : 0),
            align: DataTable.CENTER,
        },
        {
            name: VDiskTableColumnsIds.Size,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.Size],
            width: 100,
            render: ({row}) => {
                return (
                    <ProgressViewer
                        value={row.AllocatedSize}
                        capacity={Number(row.AllocatedSize) + Number(row.AvailableSize)}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                    />
                );
            },
            sortAccessor: (row) => Number(row.AllocatedSize),
            align: DataTable.CENTER,
        },
        {
            name: VDiskTableColumnsIds.Info,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.Info],
            width: 70,
            render: ({row}) => {
                return (
                    <Popover
                        placement={['right']}
                        content={<Vdisk {...row} />}
                        tooltipContentClassName={b('vdisk-details')}
                    >
                        <Button
                            view="flat-secondary"
                            className={b('vdisk-details-button', {
                                selected: row.id === selectedVdiskId,
                            })}
                        >
                            <Icon name="information" viewBox="0 0 512 512" height={16} width={16} />
                        </Button>
                    </Popover>
                );
            },
            sortable: false,
        },
    ];
    return columns;
}

export function PDisk({
    id,
    data,
    selectedVdiskId,
    nodeId,
    unfolded: unfoldedFromProps,
}: PDiskProps) {
    const [unfolded, setUnfolded] = useState(unfoldedFromProps ?? false);

    const {
        TotalSize = 0,
        AvailableSize = 0,
        Device,
        Guid,
        PDiskId,
        Path,
        Realtime,
        State,
        Category,
        Type,
        SerialNumber,
        vDisks,
    } = data;

    const total = Number(TotalSize);
    const available = Number(AvailableSize);

    const onOpenPDiskDetails = () => {
        setUnfolded(true);
    };
    const onClosePDiskDetails = () => {
        setUnfolded(false);
    };

    const renderVDisks = () => {
        return (
            <DataTable
                theme="yandex-cloud"
                data={vDisks}
                columns={getColumns({nodeId, pDiskId: PDiskId, selectedVdiskId})}
                settings={{...DEFAULT_TABLE_SETTINGS, dynamicRender: false}}
                rowClassName={(row) => {
                    return row.id === selectedVdiskId ? b('selected-vdisk') : '';
                }}
            />
        );
    };

    const renderPDiskDetails = () => {
        if (isEmpty(data)) {
            return <div>No information about PDisk</div>;
        }
        let pDiskInternalViewerLink = null;

        if (valueIsDefined(PDiskId) && valueIsDefined(nodeId)) {
            pDiskInternalViewerLink = createPDiskDeveloperUILink({
                nodeId,
                pDiskId: PDiskId,
            });
        }

        const pdiskInfo: InfoViewerItem[] = [
            {
                label: 'PDisk Id',
                value: (
                    <div className={b('pdisk-id')}>
                        {PDiskId}
                        {pDiskInternalViewerLink && (
                            <Button
                                size="s"
                                className={b('external-button')}
                                href={pDiskInternalViewerLink}
                                target="_blank"
                                view="flat-secondary"
                                title={i18n('pdisk.developer-ui-button-title')}
                            >
                                <Icon name="external" />
                            </Button>
                        )}
                    </div>
                ),
            },
        ];
        if (valueIsDefined(Path)) {
            pdiskInfo.push({label: 'Path', value: Path});
        }
        if (valueIsDefined(Guid)) {
            pdiskInfo.push({label: 'GUID', value: Guid});
        }
        if (valueIsDefined(Category)) {
            pdiskInfo.push({label: 'Category', value: Category});
            pdiskInfo.push({label: 'Type', value: Type});
        }
        pdiskInfo.push({
            label: 'Allocated Size',
            value: bytesToGB(total - available),
        });
        pdiskInfo.push({
            label: 'Available Size',
            value: bytesToGB(available),
        });
        if (total >= 0 && available >= 0) {
            pdiskInfo.push({
                label: 'Size',
                value: (
                    <ProgressViewer
                        value={total - available}
                        capacity={total}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                        className={b('size')}
                    />
                ),
            });
        }
        if (valueIsDefined(State)) {
            pdiskInfo.push({label: 'State', value: State});
        }
        if (valueIsDefined(Device)) {
            pdiskInfo.push({
                label: 'Device',
                value: <EntityStatus status={Device} />,
            });
        }
        if (valueIsDefined(Realtime)) {
            pdiskInfo.push({
                label: 'Realtime',
                value: <EntityStatus status={Realtime} />,
            });
        }
        if (valueIsDefined(SerialNumber)) {
            pdiskInfo.push({label: 'SerialNumber', value: SerialNumber});
        }
        return (
            <div>
                <InfoViewer className={b('pdisk-details')} info={pdiskInfo} />
                <div className={b('vdisks-container')}>
                    <div className={b('vdisks-header')}>VDisks</div>
                    {renderVDisks()}
                </div>
            </div>
        );
    };

    return (
        <div className={b('pdisk')} id={id}>
            <div className={b('pdisk-header')}>
                <div className={b('pdisk-title-wrapper')}>
                    <EntityStatus status={Device} />
                    <PDiskTitleBadge
                        label="PDiskID"
                        value={PDiskId}
                        className={b('pdisk-title-id')}
                    />
                    <PDiskTitleBadge value={Type} className={b('pdisk-title-type')} />
                    <ProgressViewer
                        value={total - available}
                        capacity={total}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                        className={b('pdisk-title-size')}
                    />
                    <PDiskTitleBadge label="VDisks" value={vDisks.length} />
                </div>
                <Button
                    onClick={unfolded ? onClosePDiskDetails : onOpenPDiskDetails}
                    view="flat-secondary"
                >
                    <ArrowToggle direction={unfolded ? 'top' : 'bottom'} />
                </Button>
            </div>
            {unfolded && renderPDiskDetails()}
        </div>
    );
}

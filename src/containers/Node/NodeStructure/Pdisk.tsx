import {useState} from 'react';
import cn from 'bem-cn-lite';
import _ from 'lodash';

import {ArrowToggle, Button, Popover} from '@gravity-ui/uikit';

import DataTable, {Column, Settings} from '@gravity-ui/react-data-table';

import EntityStatus from '../../../components/EntityStatus/EntityStatus';
import InfoViewer from '../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {Icon} from '../../../components/Icon';
import {Vdisk} from './Vdisk';

import {bytesToGB, pad9} from '../../../utils/utils';
import {formatStorageValuesToGb} from '../../../utils/dataFormatters/dataFormatters';
import {getPDiskType} from '../../../utils/pdisk';

import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {valueIsDefined} from './NodeStructure';
import {PDiskTitleBadge} from './PDiskTitleBadge';

const b = cn('kv-node-structure');

interface PDiskProps {
    data: Record<string, any>;
    unfolded?: boolean;
    id: string;
    selectedVdiskId?: string;
    nodeHref?: string | null;
}

enum VDiskTableColumnsIds {
    slotId = 'VDiskSlotId',
    VDiskState = 'VDiskState',
    Size = 'Size',
    Info = 'Info',
}

type VDiskTableColumnsIdsKeys = keyof typeof VDiskTableColumnsIds;
type VDiskTableColumnsIdsValues = typeof VDiskTableColumnsIds[VDiskTableColumnsIdsKeys];

const vDiskTableColumnsNames: Record<VDiskTableColumnsIdsValues, string> = {
    VDiskSlotId: 'Slot id',
    VDiskState: 'Status',
    Size: 'Size',
    Info: '',
};

interface RowType {
    id: string;
    [VDiskTableColumnsIds.slotId]: number;
    [VDiskTableColumnsIds.VDiskState]: string;
    AllocatedSize: string;
    AvailableSize: string;
}

function getColumns({
    pDiskId,
    selectedVdiskId,
    nodeHref,
}: {
    pDiskId: number;
    selectedVdiskId?: string;
    nodeHref?: string | null;
}) {
    const columns: Column<RowType>[] = [
        {
            name: VDiskTableColumnsIds.slotId as string,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.slotId],
            width: 100,
            render: ({value, row}) => {
                let vdiskInternalViewerLink = '';

                if (nodeHref && value !== undefined) {
                    vdiskInternalViewerLink +=
                        nodeHref + 'actors/vdisks/vdisk' + pad9(pDiskId) + '_' + pad9(value);
                }

                return (
                    <div className={b('vdisk-id', {selected: row.id === selectedVdiskId})}>
                        <span>{value as number}</span>
                        {vdiskInternalViewerLink && (
                            <Button
                                size="s"
                                className={b('external-button', {hidden: true})}
                                href={vdiskInternalViewerLink}
                                target="_blank"
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
            name: VDiskTableColumnsIds.VDiskState as string,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.VDiskState],
            width: 70,
            render: ({value}) => {
                return <EntityStatus status={value === 'OK' ? 'green' : 'red'} />;
            },
            sortAccessor: (row) => (row[VDiskTableColumnsIds.VDiskState] === 'OK' ? 1 : 0),
            align: DataTable.CENTER,
        },
        {
            name: VDiskTableColumnsIds.Size as string,
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
            name: VDiskTableColumnsIds.Info as string,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.Info],
            width: 70,
            render: ({row}) => {
                return (
                    <Popover
                        placement={['right']}
                        content={<Vdisk {...row} />}
                        contentClassName={b('vdisk-details')}
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

export function PDisk(props: PDiskProps) {
    const [unfolded, setUnfolded] = useState(props.unfolded ?? false);

    const data = props.data ?? {};

    const onOpenPDiskDetails = () => {
        setUnfolded(true);
    };
    const onClosePDiskDetails = () => {
        setUnfolded(false);
    };

    const renderVDisks = () => {
        const {selectedVdiskId, data, nodeHref} = props;
        const {vDisks} = data;

        return (
            <DataTable
                theme="yandex-cloud"
                data={vDisks}
                columns={getColumns({nodeHref, pDiskId: data.PDiskId, selectedVdiskId})}
                settings={{...DEFAULT_TABLE_SETTINGS, dynamicRender: false} as Settings}
                rowClassName={(row) => {
                    return row.id === selectedVdiskId ? b('selected-vdisk') : '';
                }}
            />
        );
    };

    const renderPDiskDetails = () => {
        if (_.isEmpty(data)) {
            return <div>No information about PDisk</div>;
        }
        const {nodeHref} = props;
        const {
            TotalSize,
            AvailableSize,
            Device,
            Guid,
            PDiskId,
            Path,
            Realtime,
            State,
            Category,
            SerialNumber,
        } = data;

        let pDiskInternalViewerLink = '';

        if (nodeHref) {
            pDiskInternalViewerLink += nodeHref + 'actors/pdisks/pdisk' + pad9(PDiskId);
        }

        const pdiskInfo: any = [
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
            pdiskInfo.push({label: 'Type', value: getPDiskType(data)});
        }
        pdiskInfo.push({
            label: 'Allocated Size',
            value: bytesToGB(TotalSize - AvailableSize),
        });
        pdiskInfo.push({
            label: 'Available Size',
            value: bytesToGB(AvailableSize),
        });
        if (Number(TotalSize) >= 0 && Number(AvailableSize) >= 0) {
            pdiskInfo.push({
                label: 'Size',
                value: (
                    <ProgressViewer
                        value={TotalSize - AvailableSize}
                        capacity={TotalSize}
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
        <div className={b('pdisk')} id={props.id}>
            <div className={b('pdisk-header')}>
                <div className={b('pdisk-title-wrapper')}>
                    <EntityStatus status={data.Device} />
                    <PDiskTitleBadge
                        label="PDiskID"
                        value={data.PDiskId}
                        className={b('pdisk-title-id')}
                    />
                    <PDiskTitleBadge value={getPDiskType(data)} className={b('pdisk-title-type')} />
                    <ProgressViewer
                        value={data.TotalSize - data.AvailableSize}
                        capacity={data.TotalSize}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                        className={b('pdisk-title-size')}
                    />
                    <PDiskTitleBadge label="VDisks" value={data.vDisks.length} />
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

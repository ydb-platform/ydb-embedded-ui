import React from 'react';

import {ArrowUpRightFromSquare, CircleInfoFill} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import {ArrowToggle, Button, Icon, Popover} from '@gravity-ui/uikit';
import isEmpty from 'lodash/isEmpty';

import {PDiskInfo} from '../../../components/PDiskInfo/PDiskInfo';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {StatusIcon} from '../../../components/StatusIcon/StatusIcon';
import {VDiskInfo} from '../../../components/VDiskInfo/VDiskInfo';
import type {
    PreparedStructurePDisk,
    PreparedStructureVDisk,
} from '../../../store/reducers/node/types';
import {EFlag} from '../../../types/api/enums';
import {EVDiskState} from '../../../types/api/vdisk';
import type {ValueOf} from '../../../types/common';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {formatStorageValuesToGb} from '../../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink} from '../../../utils/developerUI/developerUI';
import {useIsUserAllowedToMakeChanges} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import i18n from '../i18n';

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
    withDeveloperUILink,
}: {
    pDiskId: number | undefined;
    selectedVdiskId?: string;
    nodeId?: string | number;
    withDeveloperUILink?: boolean;
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
                        {vdiskInternalViewerLink && withDeveloperUILink ? (
                            <Button
                                size="s"
                                className={b('external-button', {hidden: true})}
                                href={vdiskInternalViewerLink}
                                target="_blank"
                                title={i18n('vdisk.developer-ui-button-title')}
                            >
                                <Icon data={ArrowUpRightFromSquare} />
                            </Button>
                        ) : null}
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
                    <StatusIcon
                        status={row.VDiskState === EVDiskState.OK ? EFlag.Green : EFlag.Red}
                    />
                );
            },
            sortAccessor: (row) => (row.VDiskState === EVDiskState.OK ? 1 : 0),
            align: DataTable.CENTER,
        },
        {
            name: VDiskTableColumnsIds.Size,
            header: vDiskTableColumnsNames[VDiskTableColumnsIds.Size],
            width: 170,
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
                        content={
                            <VDiskInfo
                                data={row}
                                withTitle
                                withVDiskPageLink
                                className={b('vdisk-details')}
                            />
                        }
                    >
                        <Button
                            view="flat-secondary"
                            className={b('vdisk-details-button', {
                                selected: row.id === selectedVdiskId,
                            })}
                        >
                            <Icon data={CircleInfoFill} size={18} />
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
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const [unfolded, setUnfolded] = React.useState(unfoldedFromProps ?? false);

    const {TotalSize = 0, AvailableSize = 0, Device, PDiskId, Type, vDisks} = data;

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
                columns={getColumns({
                    nodeId,
                    pDiskId: PDiskId,
                    selectedVdiskId,
                    withDeveloperUILink: isUserAllowedToMakeChanges,
                })}
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

        return (
            <div>
                <PDiskInfo
                    pDisk={data}
                    nodeId={nodeId}
                    className={b('pdisk-details')}
                    withPDiskPageLink
                />
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
                    <StatusIcon status={Device} />
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

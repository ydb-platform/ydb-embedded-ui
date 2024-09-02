import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {Switch} from '@gravity-ui/uikit';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import type {TClusterConfigFeatureFlag} from '../../../../types/api/cluster';

enum Statuses {
    'Idle',
    'Error',
    'Success',
}

const FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY = 'featureFlagsColumnsWidth';

const columns: Column<TClusterConfigFeatureFlag>[] = [
    {
        name: 'Feature flag',
        render: ({row}) =>
            row.Current ? <b title="Default value was changed">{row.Name}</b> : row.Name,
        width: 400,
        sortable: false,
    },
    {
        name: 'Default',
        render: ({row}) => {
            switch (row.Default) {
                case true:
                    return 'Enabled';
                case false:
                    return 'Disabled';
                default:
                    return '-';
            }
        },
        width: 100,
        sortable: false,
        resizeable: false,
    },
    {
        name: 'Current',
        render: ({row}) => <Switch disabled checked={(row.Current ?? row.Default) || false} />,
        width: 100,
        sortable: false,
        resizeable: false,
    },
];

interface Props {
    path: string;
    database: string;
}

export const Configs = ({database}: Props) => {
    const [status, setStatus] = React.useState<Statuses>(Statuses.Success);
    const [featureFlags, setFeatureFlags] = React.useState<TClusterConfigFeatureFlag[]>([]);

    React.useEffect(() => {
        window.api
            .getClusterConfig(database)
            .then((res) => {
                setFeatureFlags(res.Databases[0].FeatureFlags);
                setStatus(Statuses.Success);
            })
            .catch(() => setStatus(Statuses.Error));
    }, [database]);

    const renderContent = () => {
        if (status === Statuses.Error) {
            return 'Error while loading configs';
        }

        if (!featureFlags.length) {
            return 'No data';
        }

        return (
            <ResizeableDataTable<TClusterConfigFeatureFlag>
                columnsWidthLSKey={FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY}
                columns={columns}
                data={featureFlags}
                settings={{
                    displayIndices: false,
                }}
            />
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Table loading={status === Statuses.Idle}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};

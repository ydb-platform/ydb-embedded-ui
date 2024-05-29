import type {Column, Settings} from '@gravity-ui/react-data-table';
import {Text} from '@gravity-ui/uikit';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {
    TReplicationConfig,
    TReplicationConfigTTargetSpecificTTarget,
} from '../../../../../types/api/schema/replication';
import {cn} from '../../../../../utils/cn';

import './AsyncReplicationPaths.scss';

const b = cn('ydb-async-replication-paths');

interface AsyncReplicationPathsProps {
    config?: TReplicationConfig;
}

const settins: Settings = {
    displayIndices: false,
};

const columns: Column<TReplicationConfigTTargetSpecificTTarget>[] = [
    {
        name: 'Source',
        render: ({row}) => row.SrcPath,
        sortAccessor: (row) => row.SrcPath,
    },
    {
        name: 'Dist',
        render: ({row}) => row.DstPath,
        sortAccessor: (row) => row.DstPath,
    },
];

export function AsyncReplicationPaths({config}: AsyncReplicationPathsProps) {
    if (!config) {
        return null;
    }

    let content: React.ReactNode = 'No data.';
    if (config.Everything) {
        content = (
            <span>
                Everything with{' '}
                <Text variant="code-inline-2">{config.Everything?.DstPrefix ?? 'undefined'}</Text>{' '}
                prefix.
            </span>
        );
    }

    if (config.Specific) {
        content = (
            <ResizeableDataTable
                data={config.Specific.Targets}
                settings={settins}
                columns={columns}
            />
        );
    }

    return (
        <div className={b()}>
            <div className={b('title')}>Replicated Paths</div>
            {content}
        </div>
    );
}

import type {Column} from '@gravity-ui/react-data-table';
import {Text} from '@gravity-ui/uikit';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {TReplicationConfig, TTarget} from '../../../../../types/api/schema/replication';
import {cn} from '../../../../../utils/cn';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../../utils/constants';

import i18n from './i18n';

import './AsyncReplicationPaths.scss';

const b = cn('ydb-async-replication-paths');

interface AsyncReplicationPathsProps {
    config?: TReplicationConfig;
}

const columns: Column<TTarget>[] = [
    {
        name: i18n('column.srcPath.name'),
        render: ({row}) => row.SrcPath,
        sortAccessor: (row) => row.SrcPath,
    },
    {
        name: i18n('column.dstPath.name'),
        render: ({row}) => row.DstPath,
        sortAccessor: (row) => row.DstPath,
    },
];

export function AsyncReplicationPaths({config}: AsyncReplicationPathsProps) {
    if (!config) {
        return null;
    }

    let content: React.ReactNode = i18n('noData');
    if (config.Everything) {
        content = (
            <span>
                {i18n('everythingWithPrefix')}{' '}
                <Text variant="code-inline-2">{config.Everything?.DstPrefix ?? 'undefined'}</Text>.
            </span>
        );
    }

    if (config.Specific) {
        content = (
            <ResizeableDataTable
                data={config.Specific.Targets}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                columns={columns}
            />
        );
    }

    return (
        <div className={b()}>
            <div className={b('title')}>{i18n('title')}</div>
            {content}
        </div>
    );
}

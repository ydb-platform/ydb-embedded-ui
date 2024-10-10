import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Text} from '@gravity-ui/uikit';

import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import type {IndexBuildMetadata, TOperation} from '../../types/api/operationList';
import {EStatusCode} from '../../types/api/operationList';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';
import i18n from './i18n';

export function getColumns(): DataTableColumn<TOperation>[] {
    return [
        {
            name: COLUMNS_NAMES.ID,
            header: COLUMNS_TITLES[COLUMNS_NAMES.ID],
            width: 220,
            render: ({row}) => {
                if (!row.id) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return <EntityStatus name={row.id} showStatus={false} />;
            },
        },
        {
            name: COLUMNS_NAMES.STATUS,
            header: COLUMNS_TITLES[COLUMNS_NAMES.STATUS],
            render: ({row}) => {
                if (!row.status) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <Text color={row.status === EStatusCode.SUCCESS ? 'positive' : 'danger'}>
                        {row.status}
                    </Text>
                );
            },
        },
        {
            name: COLUMNS_NAMES.CREATED_BY,
            header: COLUMNS_TITLES[COLUMNS_NAMES.CREATED_BY],
            render: ({row}) => {
                if (!row.created_by) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return row.created_by;
            },
        },
        {
            name: COLUMNS_NAMES.CREATE_TIME,
            header: COLUMNS_TITLES[COLUMNS_NAMES.CREATE_TIME],
            render: ({row}) => {
                if (!row.create_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return new Date(row.create_time || '').toLocaleString();
            },
            sortAccessor: (row) => new Date(row.create_time || '').getTime(),
        },
        {
            name: COLUMNS_NAMES.END_TIME,
            header: COLUMNS_TITLES[COLUMNS_NAMES.END_TIME],
            render: ({row}) => {
                if (!row.end_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return row.end_time ? new Date(row.end_time).toLocaleString() : '-';
            },
            sortAccessor: (row) =>
                row.end_time ? new Date(row.end_time).getTime() : Number.MAX_SAFE_INTEGER,
        },
        {
            name: COLUMNS_NAMES.DURATION,
            header: COLUMNS_TITLES[COLUMNS_NAMES.DURATION],
            render: ({row}) => {
                if (!row.create_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                if (row.create_time && row.end_time) {
                    const duration =
                        new Date(row.end_time).getTime() - new Date(row.create_time).getTime();
                    return `${(duration / 1000).toFixed(2)}s`;
                }
                const duration = Date.now() - new Date(row.create_time || '').getTime();
                return `${(duration / 1000).toFixed(2)}s (ongoing)`;
            },
            sortAccessor: (row) => {
                if (row.create_time && row.end_time) {
                    return new Date(row.end_time).getTime() - new Date(row.create_time).getTime();
                }
                return Date.now() - new Date(row.create_time || '').getTime();
            },
        },
        {
            name: COLUMNS_NAMES.INDEX_BUILD_STATE,
            header: COLUMNS_TITLES[COLUMNS_NAMES.INDEX_BUILD_STATE],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata;
                if (!metadata || !metadata.state) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return metadata.state;
            },
        },
        {
            name: COLUMNS_NAMES.INDEX_BUILD_PROGRESS,
            header: COLUMNS_TITLES[COLUMNS_NAMES.INDEX_BUILD_PROGRESS],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata;
                if (!metadata || typeof metadata.progress !== 'number') {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return `${metadata.progress}%`;
            },
            sortAccessor: (row) => {
                const metadata = row.metadata as IndexBuildMetadata;
                return metadata && typeof metadata.progress === 'number' ? metadata.progress : -1;
            },
        },
        {
            name: COLUMNS_NAMES.INDEX_NAME,
            header: COLUMNS_TITLES[COLUMNS_NAMES.INDEX_NAME],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata;
                if (!metadata || !metadata.description || !metadata.description.index) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return metadata.description.index.name || EMPTY_DATA_PLACEHOLDER;
            },
        },
        {
            name: COLUMNS_NAMES.INDEX_TYPE,
            header: COLUMNS_TITLES[COLUMNS_NAMES.INDEX_TYPE],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata;
                if (!metadata || !metadata.description || !metadata.description.index) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                const index = metadata.description.index;
                if ('global_index' in index) {
                    return i18n('indexType.globalIndex');
                }
                if ('global_async_index' in index) {
                    return i18n('indexType.globalAsyncIndex');
                }
                if ('global_unique_index' in index) {
                    return i18n('indexType.globalUniqueIndex');
                }
                if ('global_vector_kmeans_tree_index' in index) {
                    return i18n('indexType.globalVectorKMeansTreeIndex');
                }
                return EMPTY_DATA_PLACEHOLDER;
            },
        },
        {
            name: COLUMNS_NAMES.INDEX_PATH,
            header: COLUMNS_TITLES[COLUMNS_NAMES.INDEX_PATH],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata;
                if (!metadata || !metadata.description || !metadata.description.path) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return metadata.description.path;
            },
        },
        {
            name: COLUMNS_NAMES.INDEX_COLUMNS,
            header: COLUMNS_TITLES[COLUMNS_NAMES.INDEX_COLUMNS],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata;
                if (
                    !metadata ||
                    !metadata.description ||
                    !metadata.description.index ||
                    !metadata.description.index.index_columns
                ) {
                    return EMPTY_DATA_PLACEHOLDER;
                }

                return metadata.description.index.index_columns.join(', ');
            },
        },
    ];
}

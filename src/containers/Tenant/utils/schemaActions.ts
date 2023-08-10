import {Dispatch} from 'react';
import copy from 'copy-to-clipboard';

import type {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import type {QueryMode} from '../../../types/store/query';
import type {SetQueryModeIfAvailable} from '../../../utils/hooks';
import {changeUserInput} from '../../../store/reducers/executeQuery';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {TENANT_QUERY_TABS_ID, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import createToast from '../../../utils/createToast';

import i18n from '../i18n';

const createTableTemplate = (path: string) => {
    return `CREATE TABLE \`${path}/my_table\`
(
    \`id\` Uint64,
    \`name\` String,
    PRIMARY KEY (\`id\`)
);`;
};
const alterTableTemplate = (path: string) => {
    return `ALTER TABLE \`${path}\`
    ADD COLUMN is_deleted Bool;`;
};
const selectQueryTemplate = (path: string) => {
    return `SELECT *
    FROM \`${path}\`
    LIMIT 10;`;
};
const upsertQueryTemplate = (path: string) => {
    return `UPSERT INTO \`${path}\`
    ( \`id\`, \`name\` )
VALUES ( );`;
};

const dropExternalTableTemplate = (path: string) => {
    return `DROP EXTERNAL TABLE \`${path}\`;`;
};

const createExternalTableTemplate = (path: string) => {
    // Remove data source name from path
    // to create table in the same folder with data source
    const targetPath = path.split('/').slice(0, -1).join('/');

    return `CREATE EXTERNAL TABLE \`${targetPath}/my_external_table\` (
    column1 Int,
    column2 Int
) WITH (
    DATA_SOURCE="${path}",
    LOCATION="",
    FORMAT="json_as_string",
    \`file_pattern\`=""
);`;
};

const createTopicTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_topic
CREATE TOPIC \`${path}/my_topic\` (
    CONSUMER consumer1,
    CONSUMER consumer2 WITH (read_from = Datetime('2022-12-01T12:13:22Z')) -- Sets up the message write time starting from which the consumer will receive data.
                                                                           -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format). 
                                                                           -- Default value: now
) WITH (
    min_active_partitions = 5, -- Minimum number of topic partitions.
    partition_count_limit = 10, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
    retention_period = Interval('PT12H'), -- Data retention period in the topic. Value type: Interval, default value: 18h.
    retention_storage_mb = 1, -- Limit on the maximum disk space occupied by the topic data. When this value is exceeded, 
                              -- the older data is cleared, like under a retention policy. 0 is interpreted as unlimited.
    partition_write_speed_bytes_per_second = 2097152, -- Maximum allowed write speed per partition.
    partition_write_burst_bytes = 2097152 -- Write quota allocated for write bursts. When set to zero, the actual write_burst value is equalled 
                                          -- to the quota value (this allows write bursts of up to one second).
);`;
};

const alterTopicTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/alter_topic
ALTER TOPIC \`${path}\`
    ADD CONSUMER new_consumer WITH (read_from = 0), -- Sets up the message write time starting from which the consumer will receive data.
                                                    -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format).
                                                    -- Default value: now
    ALTER CONSUMER consumer1 SET (read_from = Datetime('2023-12-01T12:13:22Z')),
    DROP CONSUMER consumer2,
    SET (
        min_active_partitions = 10, -- Minimum number of topic partitions.
        partition_count_limit = 15, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
        retention_period = Interval('PT36H'), -- Data retention period in the topic. Value type: Interval, default value: 18h.
        retention_storage_mb = 10, -- Limit on the maximum disk space occupied by the topic data. When this value is exceeded, 
                                   -- the older data is cleared, like under a retention policy. 0 is interpreted as unlimited.
        partition_write_speed_bytes_per_second = 3145728, -- Maximum allowed write speed per partition.
        partition_write_burst_bytes = 1048576 -- Write quota allocated for write bursts. When set to zero, the actual write_burst value is equalled 
                                              -- to the quota value (this allows write bursts of up to one second).
    );`;
};

const dropTopicTemplate = (path: string) => {
    return `DROP TOPIC \`${path}\`;`;
};

interface ActionsAdditionalEffects {
    setQueryMode: SetQueryModeIfAvailable;
    setActivePath: (path: string) => void;
}

const bindActions = (
    path: string,
    dispatch: Dispatch<any>,
    additionalEffects: ActionsAdditionalEffects,
) => {
    const {setActivePath, setQueryMode} = additionalEffects;

    const inputQuery =
        (tmpl: (path: string) => string, mode?: QueryMode, setQueryModeErrorMessage?: string) =>
        () => {
            const isNewQueryModeSet = mode && setQueryMode(mode, setQueryModeErrorMessage);

            if (!mode || isNewQueryModeSet) {
                dispatch(changeUserInput({input: tmpl(path)}));
                dispatch(setTenantPage(TENANT_PAGES_IDS.query));
                dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
                setActivePath(path);
            }
        };

    return {
        createTable: inputQuery(createTableTemplate, 'script'),
        alterTable: inputQuery(alterTableTemplate, 'script'),
        selectQuery: inputQuery(selectQueryTemplate),
        upsertQuery: inputQuery(upsertQueryTemplate),
        createExternalTable: inputQuery(createExternalTableTemplate, 'script'),
        dropExternalTable: inputQuery(dropExternalTableTemplate, 'script'),
        selectQueryFromExternalTable: inputQuery(
            selectQueryTemplate,
            'query',
            i18n('actions.externalTableSelectUnavailable'),
        ),
        createTopic: inputQuery(createTopicTemplate, 'script'),
        alterTopic: inputQuery(alterTopicTemplate, 'script'),
        dropTopic: inputQuery(dropTopicTemplate, 'script'),
        copyPath: () => {
            try {
                copy(path);
                createToast({
                    name: 'Copied',
                    title: i18n('actions.copied'),
                    type: 'success',
                });
            } catch {
                createToast({
                    name: 'Not copied',
                    title: i18n('actions.notCopied'),
                    type: 'error',
                });
            }
        },
    };
};

type ActionsSet = ReturnType<Required<NavigationTreeProps>['getActions']>;

export const getActions =
    (dispatch: Dispatch<any>, additionalEffects: ActionsAdditionalEffects) =>
    (path: string, type: NavigationTreeNodeType) => {
        const actions = bindActions(path, dispatch, additionalEffects);
        const copyItem = {text: i18n('actions.copyPath'), action: actions.copyPath};

        const DIR_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.createTable'), action: actions.createTable},
                {text: i18n('actions.createTopic'), action: actions.createTopic},
            ],
        ];
        const TABLE_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTable'), action: actions.alterTable},
                {text: i18n('actions.selectQuery'), action: actions.selectQuery},
                {text: i18n('actions.upsertQuery'), action: actions.upsertQuery},
            ],
        ];

        const TOPIC_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTopic'), action: actions.alterTopic},
                {text: i18n('actions.dropTopic'), action: actions.dropTopic},
            ],
        ];

        const EXTERNAL_TABLE_SET = [
            [copyItem],
            [
                {
                    text: i18n('actions.selectQuery'),
                    action: actions.selectQueryFromExternalTable,
                },
            ],
            [{text: i18n('actions.dropTable'), action: actions.dropExternalTable}],
        ];

        const EXTERNAL_DATA_SOURCE_SET = [
            [copyItem],
            [{text: i18n('actions.createExternalTable'), action: actions.createExternalTable}],
        ];

        const JUST_COPY: ActionsSet = [copyItem];

        // verbose mapping to guarantee a correct actions set for new node types
        // TS will error when a new type is added in the lib but is not mapped here
        const nodeTypeToActions: Record<NavigationTreeNodeType, ActionsSet> = {
            database: DIR_SET,
            directory: DIR_SET,

            table: TABLE_SET,
            column_table: TABLE_SET,

            index_table: JUST_COPY,
            topic: TOPIC_SET,
            stream: JUST_COPY,

            index: JUST_COPY,

            external_table: EXTERNAL_TABLE_SET,
            external_data_source: EXTERNAL_DATA_SOURCE_SET,
        };

        return nodeTypeToActions[type];
    };

import {v4 as uuidv4} from 'uuid';

import {store} from '../../../store/defaultStore';
import {addQueryTab, selectTabsById} from '../../../store/reducers/query/query';
import {getUniqueTabTitle} from '../../../store/reducers/query/utils';
import {uiFactory} from '../../../uiFactory/uiFactory';
import i18n from '../Query/NewSQL/i18n';

import {
    addFulltextIndex,
    addTableIndex,
    addVectorIndex,
    alterAsyncReplicationTemplate,
    alterStreamingQuerySettingsTemplate,
    alterStreamingQueryText,
    alterTableTemplate,
    alterTopicTemplate,
    alterTransferTemplate,
    createAsyncReplicationTemplate,
    createCdcStreamTemplate,
    createColumnTableTemplate,
    createExternalTableTemplate,
    createGroupTemplate,
    createStreamingQueryTemplate,
    createTableTemplate,
    createTopicTemplate,
    createTransferTemplate,
    createUserTemplate,
    createViewTemplate,
    deleteRowsTemplate,
    dropAsyncReplicationTemplate,
    dropExternalTableTemplate,
    dropGroupTemplate,
    dropStreamingQueryTemplate,
    dropTableIndex,
    dropTableTemplate,
    dropTopicTemplate,
    dropTransferTemplate,
    dropUserTemplate,
    grantPrivilegeTemplate,
    revokePrivilegeTemplate,
    selectQueryTemplate,
    showCreateTableTemplate,
    updateTableTemplate,
    upsertQueryTemplate,
} from './schemaQueryTemplates';

export const bindActions = (changeUserInput: (input: string) => void) => {
    const isMultiTabEnabled = Boolean(uiFactory.enableMultiTabQueryEditor);

    const inputQuery = (query: () => string, tabTitle?: string) => () => {
        const snippet = query();

        if (isMultiTabEnabled && tabTitle) {
            const tabsById = selectTabsById(store.getState());
            const title = getUniqueTabTitle(tabsById, tabTitle);
            store.dispatch(
                addQueryTab({
                    tabId: uuidv4(),
                    title,
                    pendingSnippet: snippet,
                    makeActive: true,
                }),
            );
        } else {
            changeUserInput(snippet);
        }
    };

    return {
        createRowTable: inputQuery(createTableTemplate, i18n('action.create-row-table')),
        createColumnTable: inputQuery(
            createColumnTableTemplate,
            i18n('action.create-column-table'),
        ),
        createAsyncReplication: inputQuery(
            createAsyncReplicationTemplate,
            i18n('action.create-async-replication'),
        ),
        createStreamingQuery: inputQuery(
            createStreamingQueryTemplate,
            i18n('action.create-streaming-query'),
        ),
        alterAsyncReplication: inputQuery(
            alterAsyncReplicationTemplate,
            i18n('action.alter-async-replication'),
        ),
        dropAsyncReplication: inputQuery(
            dropAsyncReplicationTemplate,
            i18n('action.drop-async-replication'),
        ),
        createTransfer: inputQuery(createTransferTemplate, i18n('action.create-transfer')),
        alterTransfer: inputQuery(alterTransferTemplate, i18n('action.alter-transfer')),
        dropTransfer: inputQuery(dropTransferTemplate, i18n('action.drop-transfer')),
        alterTable: inputQuery(alterTableTemplate, i18n('action.alter-table')),
        selectQuery: inputQuery(selectQueryTemplate, i18n('action.select-rows')),
        upsertQuery: inputQuery(upsertQueryTemplate, i18n('action.upsert-to-table')),
        createExternalTable: inputQuery(
            createExternalTableTemplate,
            i18n('action.create-external-table'),
        ),
        dropExternalTable: inputQuery(
            dropExternalTableTemplate,
            i18n('action.drop-external-table'),
        ),
        createTopic: inputQuery(createTopicTemplate, i18n('action.create-topic')),
        alterTopic: inputQuery(alterTopicTemplate, i18n('action.alter-topic')),
        dropTopic: inputQuery(dropTopicTemplate, i18n('action.drop-topic')),
        createView: inputQuery(createViewTemplate, i18n('action.create-view')),
        dropTable: inputQuery(dropTableTemplate, i18n('action.drop-table')),
        deleteRows: inputQuery(deleteRowsTemplate, i18n('action.delete-rows')),
        updateTable: inputQuery(updateTableTemplate, i18n('action.update-table')),
        addFulltextIndex: inputQuery(addFulltextIndex, i18n('action.add-fulltext-index')),
        alterStreamingQueryText: inputQuery(
            alterStreamingQueryText,
            i18n('action.alter-streaming-query-text'),
        ),
        alterStreamingQuerySettings: inputQuery(
            alterStreamingQuerySettingsTemplate,
            i18n('action.alter-streaming-query-settings'),
        ),
        dropStreamingQuery: inputQuery(
            dropStreamingQueryTemplate,
            i18n('action.drop-streaming-query'),
        ),
        createUser: inputQuery(createUserTemplate, i18n('action.create-user')),
        createGroup: inputQuery(createGroupTemplate, i18n('action.create-group')),
        createCdcStream: inputQuery(createCdcStreamTemplate, i18n('action.create-cdc-stream')),
        grantPrivilege: inputQuery(grantPrivilegeTemplate, i18n('action.grant-privilege')),
        revokePrivilege: inputQuery(revokePrivilegeTemplate, i18n('action.revoke-privilege')),
        dropUser: inputQuery(dropUserTemplate, i18n('action.drop-user')),
        dropGroup: inputQuery(dropGroupTemplate, i18n('action.drop-group')),
        addVectorIndex: inputQuery(addVectorIndex, i18n('action.add-vector-index')),
        addTableIndex: inputQuery(addTableIndex, i18n('action.add-index')),
        dropTableIndex: inputQuery(dropTableIndex, i18n('action.drop-index')),
        showCreateTable: inputQuery(showCreateTableTemplate, i18n('action.show-create-table')),
    };
};

import {changeUserInput} from '../../../store/reducers/executeQuery';

import {
    addTableIndex,
    alterAsyncReplicationTemplate,
    alterTableTemplate,
    alterTopicTemplate,
    createAsyncReplicationTemplate,
    createCdcStreamTemplate,
    createColumnTableTemplate,
    createExternalTableTemplate,
    createGroupTemplate,
    createTableTemplate,
    createTopicTemplate,
    createUserTemplate,
    createViewTemplate,
    deleteRowsTemplate,
    dropAsyncReplicationTemplate,
    dropExternalTableTemplate,
    dropGroupTemplate,
    dropTableIndex,
    dropTableTemplate,
    dropTopicTemplate,
    dropUserTemplate,
    grantPrivilegeTemplate,
    revokePrivilegeTemplate,
    selectQueryTemplate,
    updateTableTemplate,
    upsertQueryTemplate,
} from './newSQLQueryTemplates';

export const bindActions = (dispatch: React.Dispatch<any>) => {
    const inputQuery = (query: () => string) => () => {
        dispatch(changeUserInput({input: query()}));
    };

    return {
        createRowTable: inputQuery(createTableTemplate),
        createColumnTable: inputQuery(createColumnTableTemplate),
        createAsyncReplication: inputQuery(createAsyncReplicationTemplate),
        alterAsyncReplication: inputQuery(alterAsyncReplicationTemplate),
        dropAsyncReplication: inputQuery(dropAsyncReplicationTemplate),
        alterTable: inputQuery(alterTableTemplate),
        selectQuery: inputQuery(selectQueryTemplate),
        upsertQuery: inputQuery(upsertQueryTemplate),
        createExternalTable: inputQuery(createExternalTableTemplate),
        dropExternalTable: inputQuery(dropExternalTableTemplate),
        selectQueryFromExternalTable: inputQuery(selectQueryTemplate),
        createTopic: inputQuery(createTopicTemplate),
        alterTopic: inputQuery(alterTopicTemplate),
        dropTopic: inputQuery(dropTopicTemplate),
        createView: inputQuery(createViewTemplate),
        dropTable: inputQuery(dropTableTemplate),
        deleteRows: inputQuery(deleteRowsTemplate),
        updateTable: inputQuery(updateTableTemplate),
        createUser: inputQuery(createUserTemplate),
        createGroup: inputQuery(createGroupTemplate),
        createCdcStream: inputQuery(createCdcStreamTemplate),
        grantPrivilege: inputQuery(grantPrivilegeTemplate),
        revokePrivilege: inputQuery(revokePrivilegeTemplate),
        dropUser: inputQuery(dropUserTemplate),
        dropGroup: inputQuery(dropGroupTemplate),
        addTableIndex: inputQuery(addTableIndex),
        dropTableIndex: inputQuery(dropTableIndex),
    };
};

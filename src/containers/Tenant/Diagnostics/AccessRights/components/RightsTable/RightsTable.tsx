import {AccessTable} from '../../../../../../components/AccessTable/AccessTable';
import type {AccessTableRow} from '../../../../../../components/AccessTable/AccessTable';
import {useClusterWithProxy} from '../../../../../../store/reducers/cluster/cluster';
import {selectPreparedRights} from '../../../../../../store/reducers/schemaAcl/schemaAcl';
import {useAclSyntax, useTypedSelector} from '../../../../../../utils/hooks';
import {useCurrentSchema} from '../../../../TenantContext';
import {block} from '../../shared';

import {SubjectActions} from './Actions';

const RIGHT_TABLE_COLUMNS_WIDTH_LS_KEY = 'right-table-columns-width';

const renderExplicitActions = ({subject}: AccessTableRow) => <SubjectActions subject={subject} />;

export function RightsTable() {
    const {path, database, databaseFullPath} = useCurrentSchema();
    const useMetaProxy = useClusterWithProxy();
    const dialect = useAclSyntax();
    const data = useTypedSelector((state) =>
        selectPreparedRights(state, path, database, databaseFullPath, dialect, useMetaProxy),
    );
    return (
        <AccessTable
            columnsWidthLSKey={RIGHT_TABLE_COLUMNS_WIDTH_LS_KEY}
            data={data ?? []}
            renderExplicitActions={renderExplicitActions}
            className={block('rights-table')}
        />
    );
}

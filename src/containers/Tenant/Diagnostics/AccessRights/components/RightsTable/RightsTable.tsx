import type {Settings} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {selectPreparedRights} from '../../../../../../store/reducers/schemaAcl/schemaAcl';
import {DEFAULT_TABLE_SETTINGS} from '../../../../../../utils/constants';
import {useAclSyntax, useTypedSelector} from '../../../../../../utils/hooks';
import {useCurrentSchema} from '../../../../TenantContext';
import i18n from '../../i18n';
import {block} from '../../shared';

import {columns} from './columns';

const RIGHT_TABLE_COLUMNS_WIDTH_LS_KEY = 'right-table-columns-width';

const AccessRightsTableSettings: Settings = {...DEFAULT_TABLE_SETTINGS, dynamicRender: false};

export function RightsTable() {
    const {path, database, databaseFullPath} = useCurrentSchema();
    const dialect = useAclSyntax();
    const data = useTypedSelector((state) =>
        selectPreparedRights(state, path, database, databaseFullPath, dialect),
    );
    return (
        <ResizeableDataTable
            columnsWidthLSKey={RIGHT_TABLE_COLUMNS_WIDTH_LS_KEY}
            columns={columns}
            data={data ?? []}
            settings={AccessRightsTableSettings}
            emptyDataMessage={i18n('descrtiption_empty-rights')}
            wrapperClassName={block('rights-table')}
        />
    );
}

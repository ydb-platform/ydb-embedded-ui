import {LinkWithIcon} from '../../../../../components/LinkWithIcon/LinkWithIcon';
import {SchemaObjectTypeLabel} from '../../../../../components/SchemaObjectTypeLabel/SchemaObjectTypeLabel';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {prepareSystemViewType} from '../../../../../utils/schema';
import tenantKeyset from '../../../i18n';

import {schemaObjectInfoKeyset} from './i18n';

function getAuthMethodValue(data: TEvDescribeSchemeResult) {
    const {Auth} = data.PathDescription?.ExternalDataSourceDescription || {};
    if (Auth?.ServiceAccount) {
        return schemaObjectInfoKeyset('value_auth-method-service-account');
    }
    if (Auth?.Aws) {
        return schemaObjectInfoKeyset('value_auth-method-aws');
    }
    if (Auth?.Token) {
        return schemaObjectInfoKeyset('value_auth-method-token');
    }
    if (Auth?.Basic) {
        return schemaObjectInfoKeyset('value_auth-method-basic');
    }
    if (Auth?.MdbBasic) {
        return schemaObjectInfoKeyset('value_auth-method-mdb-basic');
    }
    return schemaObjectInfoKeyset('value_auth-method-none');
}

export function prepareExternalDataSourceInfo(
    data: TEvDescribeSchemeResult,
): YDBDefinitionListItem[] {
    const {SourceType, Location} = data.PathDescription?.ExternalDataSourceDescription || {};

    return [
        {
            name: tenantKeyset('summary.source-type'),
            content: SourceType,
        },
        {
            name: schemaObjectInfoKeyset('field_location'),
            content: Location,
            copyText: Location,
        },
        {
            name: schemaObjectInfoKeyset('field_auth-method'),
            content: getAuthMethodValue(data),
        },
    ];
}

export function prepareExternalTableInfo(
    data: TEvDescribeSchemeResult,
    pathToDataSource: string,
): YDBDefinitionListItem[] {
    const {SourceType, DataSourcePath, Location} =
        data.PathDescription?.ExternalTableDescription || {};
    const dataSourceName = DataSourcePath?.split('/').pop();

    return [
        {
            name: tenantKeyset('summary.source-type'),
            content: SourceType,
        },
        {
            name: tenantKeyset('summary.data-source'),
            content: DataSourcePath && (
                <span title={DataSourcePath}>
                    <LinkWithIcon title={dataSourceName || ''} url={pathToDataSource} />
                </span>
            ),
        },
        {
            name: schemaObjectInfoKeyset('field_location'),
            content: Location,
            copyText: Location,
        },
    ];
}

function formatSystemViewType(type?: string) {
    return type?.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/([a-z\d])([A-Z])/g, '$1 $2');
}

export function prepareSystemViewTypeItems(
    data?: TEvDescribeSchemeResult,
): YDBDefinitionListItem[] {
    const type = prepareSystemViewType(data?.PathDescription?.SysViewDescription?.Type);

    return [
        {
            name: tenantKeyset('summary.system-view-type'),
            content: (
                <SchemaObjectTypeLabel
                    value={formatSystemViewType(type) ?? EMPTY_DATA_PLACEHOLDER}
                    description={
                        type ? schemaObjectInfoKeyset('description_system-view-type') : undefined
                    }
                />
            ),
        },
    ];
}

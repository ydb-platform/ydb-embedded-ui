import {LinkWithIcon} from '../../../../../components/LinkWithIcon/LinkWithIcon';
import {SchemaObjectTypeLabel} from '../../../../../components/SchemaObjectTypeLabel/SchemaObjectTypeLabel';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {prepareSystemViewType} from '../../../../../utils/schema';
import tenantInfoKeyset from '../../../Info/i18n';
import objectSummaryKeyset from '../../../ObjectSummary/i18n';

import {schemaObjectInfoKeyset} from './i18n';

function getAuthMethodValue(data: TEvDescribeSchemeResult) {
    const {Auth} = data.PathDescription?.ExternalDataSourceDescription || {};
    if (Auth?.ServiceAccount) {
        return tenantInfoKeyset('external-objects.auth-method.service-account');
    }
    if (Auth?.Aws) {
        return tenantInfoKeyset('external-objects.auth-method.aws');
    }
    if (Auth?.Token) {
        return tenantInfoKeyset('external-objects.auth-method.token');
    }
    if (Auth?.Basic) {
        return tenantInfoKeyset('external-objects.auth-method.basic');
    }
    if (Auth?.MdbBasic) {
        return tenantInfoKeyset('external-objects.auth-method.mdb-basic');
    }
    return tenantInfoKeyset('external-objects.auth-method.none');
}

export function prepareExternalDataSourceInfo(
    data: TEvDescribeSchemeResult,
): YDBDefinitionListItem[] {
    const {SourceType, Location} = data.PathDescription?.ExternalDataSourceDescription || {};

    return [
        {
            name: objectSummaryKeyset('field_source-type'),
            content: SourceType,
        },
        {
            name: tenantInfoKeyset('external-objects.location'),
            content: Location,
            copyText: Location,
        },
        {
            name: tenantInfoKeyset('external-objects.auth-method'),
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
            name: objectSummaryKeyset('field_source-type'),
            content: SourceType,
        },
        {
            name: objectSummaryKeyset('field_data-source'),
            content: DataSourcePath && (
                <span title={DataSourcePath}>
                    <LinkWithIcon title={dataSourceName || ''} url={pathToDataSource} />
                </span>
            ),
        },
        {
            name: tenantInfoKeyset('external-objects.location'),
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
            name: objectSummaryKeyset('field_system-view-type'),
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

import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {getEntityName} from '../../utils';
import i18n from '../i18n';
import {prepareCreateTimeItem, renderNoEntityDataError} from '../utils';

function prepareExternalDataSourceSummary(data: TEvDescribeSchemeResult): YDBDefinitionListItem[] {
    const info: YDBDefinitionListItem[] = [
        {
            name: i18n('external-objects.source-type'),
            content: data.PathDescription?.ExternalDataSourceDescription?.SourceType,
        },
    ];

    const createStep = data.PathDescription?.Self?.CreateStep;

    if (Number(createStep)) {
        info.push(prepareCreateTimeItem(createStep));
    }

    return info;
}

function getAuthMethodValue(data: TEvDescribeSchemeResult) {
    const {Auth} = data.PathDescription?.ExternalDataSourceDescription || {};
    if (Auth?.ServiceAccount) {
        return i18n('external-objects.auth-method.service-account');
    }
    if (Auth?.Aws) {
        return i18n('external-objects.auth-method.aws');
    }
    if (Auth?.Token) {
        return i18n('external-objects.auth-method.token');
    }
    if (Auth?.Basic) {
        return i18n('external-objects.auth-method.basic');
    }
    if (Auth?.MdbBasic) {
        return i18n('external-objects.auth-method.mdb-basic');
    }
    return i18n('external-objects.auth-method.none');
}

function prepareExternalDataSourceInfo(data: TEvDescribeSchemeResult): YDBDefinitionListItem[] {
    const {Location} = data.PathDescription?.ExternalDataSourceDescription || {};

    return [
        ...prepareExternalDataSourceSummary(data),
        {
            name: i18n('external-objects.location'),
            content: Location,
            copyText: Location,
        },
        {
            name: i18n('external-objects.auth-method'),
            content: getAuthMethodValue(data),
        },
    ];
}

interface ExternalDataSourceProps {
    data?: TEvDescribeSchemeResult;
    prepareData: (data: TEvDescribeSchemeResult) => YDBDefinitionListItem[];
}

const ExternalDataSource = ({data, prepareData}: ExternalDataSourceProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return renderNoEntityDataError(entityName);
    }
    return <YDBDefinitionList title={entityName} items={prepareData(data)} />;
};

export const ExternalDataSourceInfo = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalDataSource data={data} prepareData={prepareExternalDataSourceInfo} />;
};

export const ExternalDataSourceSummary = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalDataSource data={data} prepareData={prepareExternalDataSourceSummary} />;
};

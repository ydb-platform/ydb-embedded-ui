import {useLocation} from 'react-router-dom';

import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {createExternalUILink, parseQuery} from '../../../../routes';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {getEntityName} from '../../utils';
import i18n from '../i18n';
import {prepareCreateTimeItem, renderNoEntityDataError} from '../utils';

const prepareExternalTableSummary = (data: TEvDescribeSchemeResult, pathToDataSource: string) => {
    const {CreateStep} = data.PathDescription?.Self || {};
    const {SourceType, DataSourcePath} = data.PathDescription?.ExternalTableDescription || {};

    const dataSourceName = DataSourcePath?.split('/').pop();

    const info: YDBDefinitionListItem[] = [
        {name: i18n('external-objects.source-type'), content: SourceType},
    ];

    if (Number(CreateStep)) {
        info.push(prepareCreateTimeItem(CreateStep));
    }

    info.push({
        name: i18n('external-objects.data-source'),
        content: DataSourcePath && (
            <span title={DataSourcePath}>
                <LinkWithIcon title={dataSourceName || ''} url={pathToDataSource} />
            </span>
        ),
    });

    return info;
};

const prepareExternalTableInfo = (
    data: TEvDescribeSchemeResult,
    pathToDataSource: string,
): YDBDefinitionListItem[] => {
    const location = data.PathDescription?.ExternalTableDescription?.Location;

    return [
        ...prepareExternalTableSummary(data, pathToDataSource),
        {
            name: i18n('external-objects.location'),
            content: location,
            copyText: location,
        },
    ];
};

interface ExternalTableProps {
    data?: TEvDescribeSchemeResult;
    prepareData: (
        data: TEvDescribeSchemeResult,
        pathToDataSource: string,
    ) => YDBDefinitionListItem[];
}

const ExternalTable = ({data, prepareData}: ExternalTableProps) => {
    const location = useLocation();
    const query = parseQuery(location);

    const pathToDataSource = createExternalUILink({
        ...query,
        schema: data?.PathDescription?.ExternalTableDescription?.DataSourcePath,
    });

    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return renderNoEntityDataError(entityName);
    }

    return <YDBDefinitionList title={entityName} items={prepareData(data, pathToDataSource)} />;
};

export const ExternalTableInfo = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalTable data={data} prepareData={prepareExternalTableInfo} />;
};

export const ExternalTableSummary = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalTable data={data} prepareData={prepareExternalTableSummary} />;
};

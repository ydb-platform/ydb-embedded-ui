import {useLocation} from 'react-router';
import block from 'bem-cn-lite';

import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {useTypedSelector} from '../../../../utils/hooks';
import {createHref, parseQuery} from '../../../../routes';
import {formatCommonItem} from '../../../../components/InfoViewer/formatters';
import {InfoViewer, InfoViewerItem} from '../../../../components/InfoViewer';
import {ExternalLinkWithIcon} from '../../../../components/ExternalLinkWithIcon/ExternalLinkWithIcon';
import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {getEntityName} from '../../utils';

import i18n from '../i18n';
import './ExternalTable.scss';

const b = block('ydb-external-table-info');

const prepareExternalTableSummary = (
    data: TEvDescribeSchemeResult,
    pathToDataSource: string,
): InfoViewerItem[] => {
    const {CreateStep} = data.PathDescription?.Self || {};
    const {SourceType, DataSourcePath} = data.PathDescription?.ExternalTableDescription || {};

    const dataSourceName = DataSourcePath?.split('/').pop();

    return [
        {label: i18n('external-objects.source-type'), value: SourceType},
        formatCommonItem('CreateStep', CreateStep),
        {
            label: i18n('external-objects.data-source'),
            value: DataSourcePath && (
                <span title={DataSourcePath}>
                    <ExternalLinkWithIcon title={dataSourceName || ''} url={pathToDataSource} />
                </span>
            ),
        },
    ];
};

const prepareExternalTableInfo = (
    data: TEvDescribeSchemeResult,
    pathToDataSource: string,
): InfoViewerItem[] => {
    const location = data.PathDescription?.ExternalTableDescription?.Location;

    return [
        ...prepareExternalTableSummary(data, pathToDataSource),
        {
            label: i18n('external-objects.location'),
            value: (
                <EntityStatus
                    name={location}
                    showStatus={false}
                    hasClipboardButton
                    clipboardButtonAlwaysVisible
                    className={b('location')}
                />
            ),
        },
    ];
};

interface ExternalTableProps {
    data?: TEvDescribeSchemeResult;
    prepareData: (data: TEvDescribeSchemeResult, pathToDataSource: string) => InfoViewerItem[];
}

const ExternalTable = ({data, prepareData}: ExternalTableProps) => {
    const location = useLocation();
    const query = parseQuery(location);

    // embedded version could be located in some folder (e.g. host/some_folder/app_router_path)
    // window.location has the full pathname, while location from router ignores path to project
    const pathToDataSource = createHref(window.location.pathname, undefined, {
        ...query,
        schema: data?.PathDescription?.ExternalTableDescription?.DataSourcePath,
    });

    const entityName = getEntityName(data?.PathDescription);

    const {error: schemaError} = useTypedSelector((state) => state.schema);

    if (schemaError) {
        return <ResponseError error={schemaError} />;
    }

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    return <InfoViewer title={entityName} info={prepareData(data, pathToDataSource)} />;
};

export const ExternalTableInfo = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalTable data={data} prepareData={prepareExternalTableInfo} />;
};

export const ExternalTableSummary = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalTable data={data} prepareData={prepareExternalTableSummary} />;
};

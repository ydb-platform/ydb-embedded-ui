import {useLocation} from 'react-router-dom';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {formatCommonItem} from '../../../../components/InfoViewer/formatters';
import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import {createExternalUILink, parseQuery} from '../../../../routes';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {getEntityName} from '../../utils';
import i18n from '../i18n';

import './ExternalTable.scss';

const b = cn('ydb-external-table-info');

const prepareExternalTableSummary = (data: TEvDescribeSchemeResult, pathToDataSource: string) => {
    const {CreateStep} = data.PathDescription?.Self || {};
    const {SourceType, DataSourcePath} = data.PathDescription?.ExternalTableDescription || {};

    const dataSourceName = DataSourcePath?.split('/').pop();

    const info: InfoViewerItem[] = [
        {label: i18n('external-objects.source-type'), value: SourceType},
    ];

    if (Number(CreateStep)) {
        info.push(formatCommonItem('CreateStep', CreateStep));
    }

    info.push({
        label: i18n('external-objects.data-source'),
        value: DataSourcePath && (
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

    const pathToDataSource = createExternalUILink({
        ...query,
        schema: data?.PathDescription?.ExternalTableDescription?.DataSourcePath,
    });

    const entityName = getEntityName(data?.PathDescription);

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

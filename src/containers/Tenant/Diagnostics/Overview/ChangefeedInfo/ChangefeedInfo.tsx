import {formatObject} from '../../../../../components/InfoViewer';
import {formatCdcStreamItem} from '../../../../../components/InfoViewer/formatters';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {TopicStats} from '../TopicStats';

export function prepareChangefeedInfo(
    changefeedData?: TEvDescribeSchemeResult,
): YDBDefinitionListItem[] {
    if (!changefeedData) {
        return [];
    }

    const streamDescription = changefeedData.PathDescription?.CdcStreamDescription;
    const {Mode, Format} = streamDescription || {};

    return formatObject(formatCdcStreamItem, {Mode, Format}).map(({label, value}) => ({
        name: String(label),
        content: value,
    }));
}

interface ChangefeedProps {
    path: string;
    databaseFullPath: string;
    database: string;
    data?: TEvDescribeSchemeResult;
    topic?: TEvDescribeSchemeResult;
}

/** Displays overview for CDCStream EPathType */
export const ChangefeedInfo = ({path, database, data, databaseFullPath}: ChangefeedProps) => {
    if (!data) {
        return null;
    }

    return <TopicStats path={path} databaseFullPath={databaseFullPath} database={database} />;
};

import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {InfoViewer, formatObject} from '../../../../../components/InfoViewer';
import {
    formatCdcStreamItem,
    formatCommonItem,
} from '../../../../../components/InfoViewer/formatters';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {getEntityName} from '../../../utils';
import {TopicStats} from '../TopicStats';

const prepareChangefeedInfo = (changefeedData?: TEvDescribeSchemeResult): Array<InfoViewerItem> => {
    if (!changefeedData) {
        return [];
    }

    const streamDescription = changefeedData?.PathDescription?.CdcStreamDescription;

    const {Mode, Format} = streamDescription || {};

    const changefeedInfo = formatObject(formatCdcStreamItem, {
        Mode,
        Format,
    });

    const createStep = changefeedData?.PathDescription?.Self?.CreateStep;

    if (Number(createStep)) {
        changefeedInfo.unshift(formatCommonItem('CreateStep', createStep));
    }

    return changefeedInfo;
};

interface ChangefeedProps {
    path: string;
    database: string;
    data?: TEvDescribeSchemeResult;
    topic?: TEvDescribeSchemeResult;
}

/** Displays overview for CDCStream EPathType */
export const ChangefeedInfo = ({path, database, data}: ChangefeedProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    return (
        <div>
            <InfoViewer title={entityName} info={prepareChangefeedInfo(data)} />
            <TopicStats path={path} database={database} />
        </div>
    );
};

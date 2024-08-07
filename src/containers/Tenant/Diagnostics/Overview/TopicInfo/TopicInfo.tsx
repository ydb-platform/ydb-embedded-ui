import {InfoViewer} from '../../../../../components/InfoViewer';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {getEntityName} from '../../../utils';
import {TopicStats} from '../TopicStats';
import {prepareTopicSchemaInfo} from '../utils';

interface TopicInfoProps {
    path: string;
    database: string;
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for PersQueueGroup EPathType */
export const TopicInfo = ({data, path, database}: TopicInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    return (
        <div>
            <InfoViewer title={entityName} info={prepareTopicSchemaInfo(data)} />
            <TopicStats path={path} database={database} />
        </div>
    );
};

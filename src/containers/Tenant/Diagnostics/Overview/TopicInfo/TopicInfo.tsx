import {InfoViewer} from '../../../../../components/InfoViewer';
import {EPathSubType} from '../../../../../types/api/schema';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import tenantKeyset from '../../../i18n';
import {TopicStats} from '../TopicStats';
import {prepareTopicSchemaInfo} from '../utils';

interface TopicInfoProps {
    path: string;
    database: string;
    databaseFullPath: string;
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for PersQueueGroup EPathType */
export const TopicInfo = ({data, path, database, databaseFullPath}: TopicInfoProps) => {
    if (!data) {
        return null;
    }

    const renderStats = () => {
        // In case of stream impl we display stats in CDC info tab instead
        if (data.PathDescription?.Self?.PathSubType === EPathSubType.EPathSubTypeStreamImpl) {
            return null;
        }

        return <TopicStats path={path} database={database} databaseFullPath={databaseFullPath} />;
    };

    return (
        <div>
            <InfoViewer
                title={tenantKeyset('summary.partitioning')}
                info={prepareTopicSchemaInfo(data)}
            />
            {renderStats()}
        </div>
    );
};

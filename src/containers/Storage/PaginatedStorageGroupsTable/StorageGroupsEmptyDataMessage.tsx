import {getEmptyDataWithIssuesMessage} from '../../../components/DataIssuesAlert/DataIssuesAlert';
import {EmptyFilter} from '../../../components/EmptyFilter/EmptyFilter';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';

import i18n from './i18n';

interface StorageNodesEmptyDataMessageProps {
    visibleEntities?: VisibleEntities;
    onShowAll?: VoidFunction;
    hasDataIssues?: boolean;
}

export const StorageGroupsEmptyDataMessage = ({
    visibleEntities,
    onShowAll,
    hasDataIssues,
}: StorageNodesEmptyDataMessageProps) => {
    let message;

    if (visibleEntities === VISIBLE_ENTITIES.space) {
        message = i18n('empty.out_of_space');
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        message = i18n('empty.degraded');
    }

    if (message && hasDataIssues) {
        // Do not claim there are no such groups when the data is known to be incomplete
        message = getEmptyDataWithIssuesMessage();
    }

    if (message) {
        return <EmptyFilter title={message} showAll={i18n('show_all')} onShowAll={onShowAll} />;
    }

    return null;
};

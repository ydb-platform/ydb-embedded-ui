import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {EmptyFilter} from '../EmptyFilter/EmptyFilter';

import i18n from './i18n';

interface StorageNodesEmptyDataMessageProps {
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    onShowAll?: VoidFunction;
}

export const StorageNodesEmptyDataMessage = ({
    visibleEntities,
    nodesUptimeFilter,
    onShowAll,
}: StorageNodesEmptyDataMessageProps) => {
    let message;

    if (visibleEntities === VISIBLE_ENTITIES.space) {
        message = i18n('empty.out_of_space');
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        message = i18n('empty.degraded');
    }

    if (nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime) {
        message = i18n('empty.small_uptime');
    }

    if (
        visibleEntities !== VISIBLE_ENTITIES.all &&
        nodesUptimeFilter !== NodesUptimeFilterValues.All
    ) {
        message = i18n('empty.several_filters');
    }

    if (message) {
        return <EmptyFilter title={message} showAll={i18n('show_all')} onShowAll={onShowAll} />;
    }

    return null;
};

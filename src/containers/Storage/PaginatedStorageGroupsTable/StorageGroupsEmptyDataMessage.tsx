import {EmptyFilter} from '../../../components/EmptyFilter/EmptyFilter';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';

import i18n from './i18n';

interface StorageNodesEmptyDataMessageProps {
    visibleEntities?: VisibleEntities;
    onShowAll?: VoidFunction;
}

export const StorageGroupsEmptyDataMessage = ({
    visibleEntities,
    onShowAll,
}: StorageNodesEmptyDataMessageProps) => {
    let message;

    if (visibleEntities === VISIBLE_ENTITIES.space) {
        message = i18n('empty.out_of_space');
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        message = i18n('empty.degraded');
    }

    if (message) {
        return <EmptyFilter title={message} showAll={i18n('show_all')} onShowAll={onShowAll} />;
    }

    return null;
};

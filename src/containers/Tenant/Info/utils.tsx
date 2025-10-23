import {Text} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../components/YDBDefinitionList/YDBDefinitionList';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';

import i18n from './i18n';

export function prepareCreateTimeItem(createStep?: string | number): YDBDefinitionListItem {
    return {
        name: i18n('created'),
        content: formatDateTime(createStep, {defaultValue: EMPTY_DATA_PLACEHOLDER}),
    };
}

export function renderNoEntityDataError(entityName: string | undefined) {
    return (
        <Text variant="body-2" color="danger">
            {i18n('no-entity-data', {entityName: entityName ?? ''})}
        </Text>
    );
}

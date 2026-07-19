import {Text} from '@gravity-ui/uikit';

import i18n from './i18n';

export function renderNoEntityDataError(entityName: string | undefined) {
    return (
        <Text variant="body-2" color="danger">
            {i18n('no-entity-data', {entityName: entityName ?? ''})}
        </Text>
    );
}

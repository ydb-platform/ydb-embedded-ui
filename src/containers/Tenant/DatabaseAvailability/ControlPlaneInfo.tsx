import {Flex, Text} from '@gravity-ui/uikit';

import {YDBDefinitionList} from '../../../components/YDBDefinitionList/YDBDefinitionList';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';

import i18n from './i18n';
import {prepareControlPlaneInfo} from './utils';

/** Database overview for the time when only control plane data is available. */
export function ControlPlaneInfo({database}: {database: string}) {
    const {databaseData} = useTenantBaseInfo(database);
    if (!databaseData) {
        return null;
    }

    const values = prepareControlPlaneInfo(databaseData);
    const items = [
        {name: i18n('field_name'), content: values.name},
        {name: i18n('field_path'), content: values.path},
        {name: i18n('field_type'), content: values.type},
        {name: i18n('field_status'), content: values.status},
    ].filter((item) => item.content !== undefined);

    return (
        <Flex direction="column" gap={3} qa="control-plane-info">
            <Text variant="subheader-2">{i18n('title_control-plane')}</Text>
            <YDBDefinitionList items={items} />
        </Flex>
    );
}

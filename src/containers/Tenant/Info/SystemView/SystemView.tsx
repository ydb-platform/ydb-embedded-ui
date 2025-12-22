import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {prepareSystemViewType} from '../../../../utils/schema';
import {getEntityName} from '../../utils';
import i18n from '../i18n';
import {renderNoEntityDataError} from '../utils';

const prepareSystemViewItems = (data: TEvDescribeSchemeResult): YDBDefinitionListItem[] => {
    const systemViewType = data.PathDescription?.SysViewDescription?.Type;

    return [
        {
            name: i18n('field_system-view-type'),
            content: prepareSystemViewType(systemViewType),
        },
    ];
};

interface SystemViewInfoProps {
    data?: TEvDescribeSchemeResult;
}

export function SystemViewInfo({data}: SystemViewInfoProps) {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return renderNoEntityDataError(entityName);
    }

    const items = prepareSystemViewItems(data);

    return <YDBDefinitionList title={entityName} items={items} />;
}

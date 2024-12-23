import type {DefinitionListItem} from '@gravity-ui/components';

import {YDBDefinitionList} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YqlHighlighter} from '../../../../components/YqlHighlighter/YqlHighlighter';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {getEntityName} from '../../utils';
import i18n from '../i18n';

const prepareViewItems = (data: TEvDescribeSchemeResult): DefinitionListItem[] => {
    const queryText = data.PathDescription?.ViewDescription?.QueryText;

    return [
        {
            name: i18n('view.query-text'),
            copyText: queryText,
            content: queryText ? <YqlHighlighter>{queryText}</YqlHighlighter> : null,
        },
    ];
};

interface ViewInfoProps {
    data?: TEvDescribeSchemeResult;
}

export function ViewInfo({data}: ViewInfoProps) {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    const items = prepareViewItems(data);

    return <YDBDefinitionList title={entityName} items={items} />;
}

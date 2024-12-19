import type {DefinitionListItem} from '@gravity-ui/components';

import {Snippet} from '../../../../components/Snippet/Snippet';
import {YDBDefinitionList} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {getEntityName} from '../../utils';
import i18n from '../i18n';

import './View.scss';

const b = cn('view');

const prepareViewItems = (data: TEvDescribeSchemeResult): DefinitionListItem[] => {
    const queryText = data.PathDescription?.ViewDescription?.QueryText;

    return [
        {
            name: i18n('view.query-text'),
            copyText: queryText,
            content: queryText ? (
                <Snippet className={b('snippet-container')}>{queryText}</Snippet>
            ) : null,
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

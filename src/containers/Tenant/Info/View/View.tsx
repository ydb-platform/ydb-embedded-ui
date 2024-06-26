import type {DefinitionListItem} from '@gravity-ui/components';
import {DefinitionList} from '@gravity-ui/components';
import {Text} from '@gravity-ui/uikit';

import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {getEntityName} from '../../utils';
import i18n from '../i18n';

const b = cn('ydb-view-info');

import './View.scss';

const prepareViewItems = (data: TEvDescribeSchemeResult): DefinitionListItem[] => {
    const queryText = data.PathDescription?.ViewDescription?.QueryText;

    return [
        {
            name: i18n('view.query-text'),
            copyText: queryText,
            content: (
                <Text variant="code-2" wordBreak="break-word">
                    {queryText}
                </Text>
            ),
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

    return (
        <div className={b(null)}>
            <div className={b('title')}>{entityName}</div>
            <DefinitionList
                nameMaxWidth={200}
                copyPosition="outside"
                className={b('properties-list')}
                items={prepareViewItems(data)}
            />
        </div>
    );
}

import React from 'react';

import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {useUserPermissions} from '../../../../../utils/hooks/useWhoami';

import {prepareSchemaObjectInfoItems} from './prepareSchemaObjectInfo';

import './SchemaObjectInfo.scss';

const b = cn('ydb-schema-object-info');

export interface SchemaObjectInfoProps {
    data?: TEvDescribeSchemeResult;
    fallbackType?: EPathType;
    path: string;
    itemsAfterType?: YDBDefinitionListItem[];
    additionalItems?: YDBDefinitionListItem[];
    createdContent?: string;
}

export function SchemaObjectInfo({
    data,
    fallbackType,
    path,
    itemsAfterType,
    additionalItems,
    createdContent,
}: SchemaObjectInfoProps) {
    const showAdministrativeFields = useUserPermissions()?.IsAdministrationAllowed === true;
    const items = React.useMemo(
        () =>
            prepareSchemaObjectInfoItems({
                data,
                fallbackType,
                path,
                itemsAfterType,
                additionalItems,
                showAdministrativeFields,
                createdContent,
            }),
        [
            additionalItems,
            createdContent,
            data,
            fallbackType,
            itemsAfterType,
            path,
            showAdministrativeFields,
        ],
    );

    return (
        <YDBDefinitionList
            items={items}
            responsive
            className={b('list')}
            wrapperClassName={b()}
            dataQa="schema-object-info"
        />
    );
}

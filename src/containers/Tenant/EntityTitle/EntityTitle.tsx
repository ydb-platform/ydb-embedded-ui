import React from 'react';

import {Label} from '@gravity-ui/uikit';

import type {TPathDescription} from '../../../types/api/schema';
import i18n from '../i18n';
import {getEntityName, isReadOnlyTable} from '../utils';

interface EntityTitleProps {
    data?: TPathDescription;
}

export function EntityTitle({data}: EntityTitleProps) {
    const entityName = getEntityName(data);

    if (isReadOnlyTable(data)) {
        return (
            <React.Fragment>
                {entityName} <Label>{i18n('label.read-only')}</Label>
            </React.Fragment>
        );
    }

    return <React.Fragment>{entityName}</React.Fragment>;
}

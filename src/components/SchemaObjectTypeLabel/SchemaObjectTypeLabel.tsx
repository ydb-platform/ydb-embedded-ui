import React from 'react';

import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {LabelWithHelpMark} from '../LabelWithHelpMark/LabelWithHelpMark';

import './SchemaObjectTypeLabel.scss';

const b = cn('ydb-schema-object-type-label');

interface SchemaObjectTypeLabelProps {
    value?: React.ReactNode;
    description?: React.ReactNode;
}

export function SchemaObjectTypeLabel({value, description}: SchemaObjectTypeLabelProps) {
    return (
        <LabelWithHelpMark
            theme="normal"
            help={description ? <div className={b('description')}>{description}</div> : undefined}
            helpMarkProps={{
                className: b('help-mark'),
                popoverProps: {placement: ['right', 'bottom']},
            }}
        >
            {value ?? EMPTY_DATA_PLACEHOLDER}
        </LabelWithHelpMark>
    );
}

import React from 'react';

import {Flex, HelpMark, Label} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

import './SchemaObjectTypeLabel.scss';

const b = cn('ydb-schema-object-type-label');

interface SchemaObjectTypeLabelProps {
    value?: React.ReactNode;
    description?: React.ReactNode;
}

export function SchemaObjectTypeLabel({value, description}: SchemaObjectTypeLabelProps) {
    return (
        <Label theme="normal">
            <Flex gap="1" alignItems="center" wrap="nowrap">
                {value ?? EMPTY_DATA_PLACEHOLDER}
                {description ? (
                    <HelpMark
                        className={b('help-mark')}
                        iconSize="s"
                        popoverProps={{placement: ['right', 'bottom']}}
                    >
                        <div className={b('description')}>{description}</div>
                    </HelpMark>
                ) : null}
            </Flex>
        </Label>
    );
}

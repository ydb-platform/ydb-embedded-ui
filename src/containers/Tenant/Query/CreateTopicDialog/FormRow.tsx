import React from 'react';

import {TriangleExclamationFill} from '@gravity-ui/icons';
import {HelpMark, Icon, Popover} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

const b = cn('ydb-create-topic-dialog');

interface FormRowProps {
    title: React.ReactNode;
    note?: React.ReactNode;
    required?: boolean;
    htmlFor?: string;
    children: React.ReactNode;
}

export function FormRow({title, note, required, htmlFor, children}: FormRowProps) {
    return (
        <div className={b('row')}>
            <label className={b('row-title')} htmlFor={htmlFor}>
                <span>
                    {title}
                    {required ? <span className={b('required-mark')}> *</span> : null}
                </span>
                {note ? <HelpMark iconSize="s">{note}</HelpMark> : null}
            </label>
            <div className={b('row-control')}>{children}</div>
        </div>
    );
}

interface IncompatibilityWarningProps {
    content: React.ReactNode;
}

export function IncompatibilityWarning({content}: IncompatibilityWarningProps) {
    return (
        <Popover content={content} placement={['top', 'bottom']}>
            <span className={b('incompatibility-warning')} tabIndex={0}>
                <Icon data={TriangleExclamationFill} size={16} />
            </span>
        </Popover>
    );
}

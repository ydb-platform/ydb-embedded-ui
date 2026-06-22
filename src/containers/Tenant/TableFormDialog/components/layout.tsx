import React from 'react';

import {HelpMark, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

const b = cn('ydb-table-form-dialog');

export function FormSection({
    title,
    note,
    children,
}: {
    title?: string;
    note?: string;
    children: React.ReactNode;
}) {
    return (
        <section className={b('section')}>
            {title ? (
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {title}
                    {note ? (
                        <HelpMark
                            className={b('help-mark')}
                            popoverProps={{
                                placement: ['bottom', 'right'],
                                className: b('help-mark-popup'),
                            }}
                        >
                            {note}
                        </HelpMark>
                    ) : null}
                </Text>
            ) : null}
            {children}
        </section>
    );
}

export function FormRow({
    title,
    note,
    htmlFor,
    children,
}: {
    title?: string;
    note?: string;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    let labelTitleNode: React.ReactNode = null;

    if (title) {
        if (htmlFor) {
            labelTitleNode = (
                <label className={b('label-title')} htmlFor={htmlFor}>
                    {title}
                </label>
            );
        } else {
            labelTitleNode = <span className={b('label-title')}>{title}</span>;
        }
    }

    return (
        <div className={b('row')}>
            <div className={b('label')}>
                {labelTitleNode}
                {note ? (
                    <HelpMark
                        className={b('help-mark')}
                        popoverProps={{
                            placement: ['bottom', 'right'],
                            className: b('help-mark-popup'),
                        }}
                    >
                        {note}
                    </HelpMark>
                ) : null}
            </div>
            <div className={b('row-control')}>{children}</div>
        </div>
    );
}

export function FormFieldError({message}: {message?: string}) {
    if (!message) {
        return null;
    }
    return (
        <Text color="danger" variant="body-1" className={b('field-error')}>
            {message}
        </Text>
    );
}

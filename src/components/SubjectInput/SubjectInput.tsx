import React from 'react';

import type {FlexProps} from '@gravity-ui/uikit';
import {Flex, Label, Text, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './SubjectInput.scss';

const block = cn('ydb-subject-input');
const PixelsInLetter = 10;

export interface SubjectInputProps {
    label: string;
    newSubjects: string[];
    setNewSubjects: React.Dispatch<React.SetStateAction<string[]>>;
    /** Maximum number of subjects that can be selected. Omit to allow any number. */
    maxSubjects?: number;
}

export function SubjectInput({
    label,
    newSubjects,
    setNewSubjects,
    maxSubjects = Infinity,
}: SubjectInputProps) {
    const [renderInline, setRenderInline] = React.useState(true);
    const [inputValue, setInputValue] = React.useState('');
    const inputId = React.useId();
    const limitReached = newSubjects.length >= maxSubjects;

    const subjectInputRef = React.useRef<HTMLInputElement>(null);
    const labelsRef = React.useRef<HTMLDivElement>(null);

    const checkWidth = (additionalWidth = 0) => {
        if (!labelsRef.current || !subjectInputRef.current) {
            return;
        }
        if (
            (labelsRef.current.offsetWidth + additionalWidth) * 2 >=
            subjectInputRef.current.offsetWidth
        ) {
            setRenderInline(false);
        } else {
            setRenderInline(true);
        }
    };

    const addSubject = () => {
        if (!inputValue || limitReached) {
            return;
        }

        setNewSubjects((prev) => (prev.length >= maxSubjects ? prev : [...prev, inputValue]));
        setInputValue('');
        checkWidth(inputValue.length * PixelsInLetter);
    };

    const handleEnterClick = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addSubject();
        }
    };

    const handleRemoveSubjectGetter = (subject: string) => {
        return () => {
            setNewSubjects((prev) => prev.filter((el) => el !== subject));
            checkWidth(-1 * subject.length * PixelsInLetter);
        };
    };

    const renderLabels = (wrap: FlexProps['wrap'] = 'nowrap') => {
        return (
            <Flex
                gap={1}
                className={block('input-content')}
                wrap={wrap}
                ref={labelsRef}
                maxWidth="100%"
            >
                {newSubjects.map((subject) => (
                    <Label
                        type="close"
                        key={subject}
                        onCloseClick={handleRemoveSubjectGetter(subject)}
                    >
                        {subject}
                    </Label>
                ))}
            </Flex>
        );
    };
    return (
        <Flex direction="column" gap={2}>
            <Flex gap={2} alignItems="start">
                <label htmlFor={inputId}>
                    <Text as="div" whiteSpace="nowrap" color="secondary" className={block('label')}>
                        {label}
                    </Text>
                </label>
                <Flex direction="column" gap={1} className={block('input-wrapper')}>
                    <TextInput
                        id={inputId}
                        name="subjectInput"
                        className={block('input')}
                        onBlur={addSubject}
                        onKeyDown={handleEnterClick}
                        value={inputValue}
                        onUpdate={setInputValue}
                        ref={subjectInputRef}
                        startContent={renderInline ? renderLabels() : undefined}
                        readOnly={limitReached}
                        autoFocus
                    />
                    {!renderInline && renderLabels('wrap')}
                </Flex>
            </Flex>
        </Flex>
    );
}

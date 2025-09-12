import React from 'react';

import type {FlexProps} from '@gravity-ui/uikit';
import {Flex, Label, Text, TextInput} from '@gravity-ui/uikit';

import i18n from '../i18n';
import {block} from '../shared';

const PixelsInLetter = 10;

interface SubjectInputProps {
    newSubjects: string[];
    setNewSubjects: React.Dispatch<React.SetStateAction<string[]>>;
}

export function SubjectInput({newSubjects, setNewSubjects}: SubjectInputProps) {
    const [renderInline, setRenderInline] = React.useState(true);
    const [inputValue, setInputValue] = React.useState('');

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

    const addNewAclSubject = () => {
        if (inputValue) {
            setNewSubjects((prev) => [...prev, inputValue]);
            setInputValue('');
            checkWidth(inputValue.length * PixelsInLetter);
        }
    };

    const handleEnterClick = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addNewAclSubject();
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
                <label htmlFor="subjectInput">
                    <Text
                        as="div"
                        whiteSpace="nowrap"
                        color="secondary"
                        className={block('subject-input-label')}
                    >
                        {i18n('label_grant-access-to')}
                    </Text>
                </label>
                <Flex direction="column" gap={1} className={block('subject-input-wrapper')}>
                    <TextInput
                        name="subjectInput"
                        className={block('subject-input')}
                        onBlur={addNewAclSubject}
                        onKeyDown={handleEnterClick}
                        value={inputValue}
                        onUpdate={setInputValue}
                        ref={subjectInputRef}
                        startContent={renderInline ? renderLabels() : undefined}
                        autoFocus
                    />
                    {!renderInline && renderLabels('wrap')}
                </Flex>
            </Flex>
        </Flex>
    );
}

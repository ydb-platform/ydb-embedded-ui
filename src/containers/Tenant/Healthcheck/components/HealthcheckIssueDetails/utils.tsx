import React from 'react';

import type {FlexProps, TextProps} from '@gravity-ui/uikit';
import {DefinitionList, Flex, Text} from '@gravity-ui/uikit';

interface SectionWithTitleProps {
    title?: string;
    children: React.ReactNode;
    titleVariant?: TextProps['variant'];
    gap?: FlexProps['gap'];
}

export function SectionWithTitle({
    title,
    children,
    titleVariant = 'body-2',
    gap = 2,
}: SectionWithTitleProps) {
    return (
        <Flex direction="column" gap={gap}>
            {title && <Text variant={titleVariant}>{title}</Text>}
            {children}
        </Flex>
    );
}

interface LocationDetailsProps {
    title?: string;
    fields: {value?: React.ReactNode; title: string; copy?: string}[];
    titleVariant?: TextProps['variant'];
}

export function LocationDetails({title, fields, titleVariant}: LocationDetailsProps) {
    const filteredFields = fields.filter((f) => f.value);

    if (filteredFields.length === 0) {
        return null;
    }

    return (
        <SectionWithTitle title={title} titleVariant={titleVariant}>
            <DefinitionList nameMaxWidth={200}>
                {filteredFields.map((field) => (
                    <DefinitionList.Item name={field.title} key={field.title} copyText={field.copy}>
                        {field.value}
                    </DefinitionList.Item>
                ))}
            </DefinitionList>
        </SectionWithTitle>
    );
}

interface IdListProps {
    ids: string[];
    renderItem?: (id: string) => React.ReactNode;
}

export function IdList({ids, renderItem}: IdListProps) {
    return (
        <Flex direction="column" gap={1}>
            {ids.map((id) => (
                <React.Fragment key={id}>{renderItem ? renderItem(id) : id}</React.Fragment>
            ))}
        </Flex>
    );
}

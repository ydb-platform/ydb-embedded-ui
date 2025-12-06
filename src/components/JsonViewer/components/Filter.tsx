import React from 'react';

import {ActionTooltip, Button, Flex, Icon, TextInput} from '@gravity-ui/uikit';

import {block} from '../constants';
import i18n from '../i18n';

import ChevronDownIcon from '@gravity-ui/icons/svgs/chevron-down.svg';
import ChevronUpIcon from '@gravity-ui/icons/svgs/chevron-up.svg';
import FontCaseIcon from '@gravity-ui/icons/svgs/font-case.svg';

interface FilterProps {
    matchIndex: number;
    matchedRows: number[];
    value: string;
    onUpdate: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onNextMatch?: (_event: unknown, diff?: number) => void;
    onPrevMatch?: (_event: unknown, diff?: number) => void;
    caseSensitive?: boolean;
    onUpdateCaseSensitive: VoidFunction;
    allMatchPaths?: string[];
}

export const Filter = React.forwardRef<HTMLInputElement, FilterProps>(function Filter(
    {
        matchIndex,
        matchedRows,
        value,
        onUpdate,
        onKeyDown,
        onNextMatch,
        onPrevMatch,
        caseSensitive,
        onUpdateCaseSensitive,
        allMatchPaths,
    },
    ref,
) {
    const totalMatches = allMatchPaths?.length || 0;
    const count = totalMatches || matchedRows.length;
    const matchPosition = count ? 1 + (matchIndex % count) : 0;
    return (
        <Flex gap={2} wrap="nowrap">
            <TextInput
                ref={ref}
                className={block('filter')}
                hasClear
                size="m"
                type="text"
                value={value}
                placeholder={i18n('description_search')}
                onUpdate={onUpdate}
                autoFocus={false}
                onKeyDown={onKeyDown}
                endContent={
                    <ActionTooltip
                        title={
                            caseSensitive
                                ? i18n('context_case-sensitive-search')
                                : i18n('context_case-sensitive-search-disabled')
                        }
                    >
                        <Button
                            view="flat-secondary"
                            onClick={onUpdateCaseSensitive}
                            selected={caseSensitive}
                        >
                            <Icon data={FontCaseIcon} />
                        </Button>
                    </ActionTooltip>
                }
            />
            <Flex gap={1} wrap="nowrap">
                <ActionTooltip title={i18n('action_next')} placement="top-start">
                    <Button
                        className={block('match-btn')}
                        view="flat-secondary"
                        onClick={onNextMatch}
                        disabled={!count}
                    >
                        <Icon data={ChevronDownIcon} />
                    </Button>
                </ActionTooltip>
                <ActionTooltip title={i18n('action_back')} placement="top-start">
                    <Button
                        className={block('match-btn')}
                        view="flat-secondary"
                        onClick={onPrevMatch}
                        disabled={!count}
                    >
                        <Icon data={ChevronUpIcon} />
                    </Button>
                </ActionTooltip>
            </Flex>
            {value && (
                <span className={block('match-counter')} title={i18n('description_matched-rows')}>
                    {matchPosition} / {count || 0}
                </span>
            )}
        </Flex>
    );
});

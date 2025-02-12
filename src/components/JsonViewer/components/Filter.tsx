import React from 'react';

import {ActionTooltip, Button, Flex, Icon, TextInput} from '@gravity-ui/uikit';

import {CASE_SENSITIVE_JSON_SEARCH} from '../../../utils/constants';
import {useSetting} from '../../../utils/hooks';
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
}

export const Filter = React.forwardRef<HTMLInputElement, FilterProps>(function Filter(
    {matchIndex, matchedRows, value, onUpdate, onKeyDown, onNextMatch, onPrevMatch},
    ref,
) {
    const [caseSensitiveSearch, setCaseSensitiveSearch] = useSetting(
        CASE_SENSITIVE_JSON_SEARCH,
        false,
    );
    const count = matchedRows.length;
    const matchPosition = count ? 1 + (matchIndex % count) : 0;
    return (
        <React.Fragment>
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
                            caseSensitiveSearch
                                ? i18n('context_case-sensitive-search')
                                : i18n('context_case-sensitive-search-disabled')
                        }
                    >
                        <Button
                            view="flat"
                            onClick={() => setCaseSensitiveSearch(!caseSensitiveSearch)}
                            selected={caseSensitiveSearch}
                        >
                            <Icon data={FontCaseIcon} />
                        </Button>
                    </ActionTooltip>
                }
            />
            <Flex gap={1} wrap="nowrap">
                <Button
                    className={block('match-btn')}
                    view="flat-secondary"
                    title="Next"
                    onClick={onNextMatch}
                    disabled={!count}
                >
                    <Icon data={ChevronDownIcon} />
                </Button>
                <Button
                    className={block('match-btn')}
                    view="flat-secondary"
                    title="Back"
                    onClick={onPrevMatch}
                    disabled={!count}
                >
                    <Icon data={ChevronUpIcon} />
                </Button>
            </Flex>
            <span className={block('match-counter')} title={'Matched rows'}>
                {matchPosition} / {count || 0}
            </span>
        </React.Fragment>
    );
});

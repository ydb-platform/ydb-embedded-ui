import React from 'react';

import {ChevronsCollapseVertical, ChevronsExpandVertical} from '@gravity-ui/icons';
import type {ReactUnipikaProps} from '@gravity-ui/react-unipika/container-scroll';
import {ReactUnipika} from '@gravity-ui/react-unipika/container-scroll';
import {ActionTooltip, Button, Flex, Icon} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../utils/hooks';
import type {ClipboardButtonProps} from '../ClipboardButton/ClipboardButton';
import {ClipboardButton} from '../ClipboardButton/ClipboardButton';

import {Filter} from './components/Filter';
import {block} from './constants';
import i18n from './i18n';

import './JsonViewer.scss';

const defaultUnipikaSettings = {
    asHTML: true,
    format: 'json',
    compact: false,
    escapeWhitespace: true,
    showDecoded: true,
    binaryAsHex: false,
    indent: 2,
    decodeUTF8: false,
};

type RenderToolbarProps = NonNullable<
    Parameters<NonNullable<ReactUnipikaProps['renderToolbar']>>[0]
>;

interface JsonViewerProps {
    search?: boolean;
    collapsedInitially?: boolean;
    maxValueWidth?: number;
    toolbarClassName?: string;
    withClipboardButton?: Omit<ClipboardButtonProps, 'size' | 'view'>;
    value: any;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

export function JsonViewer({
    value,
    search = true,
    toolbarClassName,
    withClipboardButton,
    collapsedInitially,
    scrollContainerRef,
}: JsonViewerProps) {
    const [caseSensitiveSearch, setCaseSensitiveSearch] = useSetting(
        SETTING_KEYS.CASE_SENSITIVE_JSON_SEARCH,
        false,
    );

    const renderToolbar: ReactUnipikaProps['renderToolbar'] = React.useCallback(
        ({
            filter,
            matchIndex,
            matchedRows,
            allMatchPaths,
            onExpandAll,
            onCollapseAll,
            onFilterChange,
            onNextMatch,
            onPrevMatch,
            onEnterKeyDown,
        }: RenderToolbarProps) => {
            const handleUpdateCaseSensitive = () => {
                setCaseSensitiveSearch(!caseSensitiveSearch);
            };
            return (
                <Flex
                    gap={2}
                    wrap="nowrap"
                    className={block('toolbar', toolbarClassName)}
                    justifyContent="space-between"
                >
                    {search && (
                        <Filter
                            allMatchPaths={allMatchPaths}
                            onUpdate={onFilterChange}
                            matchIndex={matchIndex}
                            matchedRows={matchedRows}
                            value={filter}
                            onKeyDown={onEnterKeyDown}
                            onNextMatch={onNextMatch}
                            onPrevMatch={onPrevMatch}
                            caseSensitive={caseSensitiveSearch}
                            onUpdateCaseSensitive={handleUpdateCaseSensitive}
                        />
                    )}
                    <Flex gap={2} wrap="nowrap">
                        <ActionTooltip title={i18n('action_expand-all')} placement="top-start">
                            <Button onClick={onExpandAll}>
                                <Icon data={ChevronsExpandVertical} />
                            </Button>
                        </ActionTooltip>
                        <ActionTooltip title={i18n('action_collapse-all')} placement="top-start">
                            <Button onClick={onCollapseAll}>
                                <Icon data={ChevronsCollapseVertical} />
                            </Button>
                        </ActionTooltip>
                        {withClipboardButton && (
                            <ClipboardButton {...withClipboardButton} size="m" view="normal" />
                        )}
                    </Flex>
                </Flex>
            );
        },
        [
            caseSensitiveSearch,
            search,
            toolbarClassName,
            withClipboardButton,
            setCaseSensitiveSearch,
        ],
    );

    const renderError = React.useCallback((error: unknown) => {
        if (error instanceof Error) {
            return <div>{error.message}</div>;
        }
        return i18n('description_unknown-error');
    }, []);

    return (
        <div className={block()}>
            {/* @ts-ignore will be fixed shortly in library*/}
            <ReactUnipika
                value={value}
                renderToolbar={renderToolbar}
                settings={defaultUnipikaSettings}
                renderError={renderError}
                caseInsensitiveSearch={!caseSensitiveSearch}
                initiallyCollapsed={collapsedInitially}
                scrollContainerRef={scrollContainerRef}
            />
        </div>
    );
}

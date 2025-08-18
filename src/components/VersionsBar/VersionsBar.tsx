import React from 'react';

import {Button, Flex, Tooltip} from '@gravity-ui/uikit';
import {debounce} from 'lodash';

import {cn} from '../../utils/cn';
import type {PreparedVersion} from '../../utils/versions/types';

import i18n from './i18n';

import './VersionsBar.scss';

const b = cn('ydb-versions-bar');

const TRUNCATION_THRESHOLD = 4;
// One more line for Show more / Hide button
const MAX_DISPLAYED_VERSIONS = TRUNCATION_THRESHOLD - 1;

const HOVER_DELAY = 200;
const TOOLTIP_OPEN_DELAY = 200;

type VersionsBarSize = 's' | 'm';

interface VersionsBarProps {
    preparedVersions: PreparedVersion[];
    withTitles?: boolean;
    size?: VersionsBarSize;
}

export function VersionsBar({preparedVersions, withTitles = true, size = 's'}: VersionsBarProps) {
    const shouldTruncateVersions = preparedVersions.length > TRUNCATION_THRESHOLD && size === 's';

    const [hoveredVersion, setHoveredVersion] = React.useState<string | undefined>();
    const [allVersionsDisplayed, setAllVersionsDisplayed] = React.useState<boolean>(false);

    const displayedVersions = React.useMemo(() => {
        const total = preparedVersions.reduce((acc, item) => acc + (item.count || 0), 0);

        return preparedVersions.map((item) => {
            return {
                value: ((item.count || 0) / total) * 100,
                color: item.color,
                version: item.version,
                count: item.count,
            };
        });
    }, [preparedVersions]);

    const truncatedDisplayedVersions = React.useMemo(() => {
        if (allVersionsDisplayed) {
            return preparedVersions;
        }

        return shouldTruncateVersions
            ? preparedVersions.slice(0, MAX_DISPLAYED_VERSIONS)
            : preparedVersions;
    }, [allVersionsDisplayed, preparedVersions, shouldTruncateVersions]);

    const handleShowAllVersions = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        event.stopPropagation();
        setAllVersionsDisplayed(true);
    };
    const handleHideAllVersions = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        event.stopPropagation();
        setAllVersionsDisplayed(false);
    };

    const renderButton = () => {
        if (!shouldTruncateVersions) {
            return null;
        }

        const truncatedVersionsCount = preparedVersions.length - MAX_DISPLAYED_VERSIONS;

        if (allVersionsDisplayed) {
            return (
                <Button
                    view="flat-secondary"
                    size={'s'}
                    onClick={handleHideAllVersions}
                    className={b('button')}
                >
                    {i18n('action_hide', {
                        count: truncatedVersionsCount,
                    })}
                </Button>
            );
        } else {
            return (
                <Button
                    view="flat-secondary"
                    size={'s'}
                    onClick={handleShowAllVersions}
                    className={b('button')}
                >
                    {i18n('action_show_more', {
                        count: truncatedVersionsCount,
                    })}
                </Button>
            );
        }
    };

    const handleMouseEnter = React.useMemo(() => {
        return debounce((version: string) => {
            setHoveredVersion(version);
        }, HOVER_DELAY);
    }, []);
    const handleMouseLeave = React.useMemo(() => {
        handleMouseEnter.cancel();

        return debounce(() => {
            setHoveredVersion(undefined);
        }, HOVER_DELAY);
    }, [handleMouseEnter]);

    const isDimmed = (version: string) => {
        return Boolean(hoveredVersion && hoveredVersion !== version);
    };

    return (
        <Flex direction={'column'} className={b('bar-wrapper', {size})} wrap>
            <Flex className={b('bar', {size})} grow={1}>
                {displayedVersions.map((item) => (
                    <Tooltip
                        key={item.version}
                        content={
                            <React.Fragment>
                                {i18n('tooltip_nodes', {count: item.count})}
                                <br />
                                {item.version}
                            </React.Fragment>
                        }
                        placement={size === 'm' ? 'auto' : 'top-start'}
                        openDelay={TOOLTIP_OPEN_DELAY}
                    >
                        <span
                            onMouseEnter={() => {
                                handleMouseEnter(item.version);
                            }}
                            onMouseLeave={handleMouseLeave}
                            className={b('version', {dimmed: isDimmed(item.version), size})}
                            style={{backgroundColor: item.color, width: `${item.value}%`}}
                        />
                    </Tooltip>
                ))}
            </Flex>

            {withTitles && (
                <Flex className={b('titles-wrapper', {size})}>
                    {truncatedDisplayedVersions.map((item) => (
                        <VersionTitle
                            key={item.version}
                            version={item.version}
                            color={item.color || ''}
                            count={item.count}
                            isDimmed={isDimmed(item.version)}
                            onMouseEnter={() => {
                                handleMouseEnter(item.version);
                            }}
                            onMouseLeave={handleMouseLeave}
                            size={size}
                        />
                    ))}
                    {renderButton()}
                </Flex>
            )}
        </Flex>
    );
}

interface VersionTitleProps {
    version: string;
    color: string;
    count?: number;
    isDimmed: boolean;
    onMouseEnter: VoidFunction;
    onMouseLeave: VoidFunction;
    size: VersionsBarSize;
}

function VersionTitle({
    version,
    color,
    count,
    isDimmed,
    onMouseEnter,
    onMouseLeave,
    size,
}: VersionTitleProps) {
    return (
        <Tooltip
            content={i18n('tooltip_nodes', {count: count})}
            placement={'bottom-end'}
            openDelay={TOOLTIP_OPEN_DELAY}
        >
            <Flex alignItems={'center'} className={b('title', {size})}>
                <VersionCircle size={size} dimmed={isDimmed} color={color} />
                <div
                    className={b('title-text', {dimmed: isDimmed, size})}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    {version}
                </div>
            </Flex>
        </Tooltip>
    );
}

interface VersionCircleProps {
    size: VersionsBarSize;
    dimmed: boolean;
    color: string;
}

function VersionCircle({size, dimmed, color}: VersionCircleProps) {
    const numericSize = size === 'm' ? 8 : 6;
    const radius = numericSize / 2;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={numericSize}
            height={numericSize}
            viewBox={`0 0 ${numericSize} ${numericSize}`}
            fill="none"
            className={b('version-icon', {dimmed})}
        >
            <circle cx={radius} cy={radius} r={radius} fill={color} />
        </svg>
    );
}

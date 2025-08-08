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

interface VersionsBarProps {
    preparedVersions: PreparedVersion[];
}

export function VersionsBar({preparedVersions}: VersionsBarProps) {
    const shouldTruncateVersions = preparedVersions.length > TRUNCATION_THRESHOLD;

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
                <Button view="flat-secondary" size={'s'} onClick={handleHideAllVersions}>
                    {i18n('action_hide', {
                        count: truncatedVersionsCount,
                    })}
                </Button>
            );
        } else {
            return (
                <Button view="flat-secondary" size={'s'} onClick={handleShowAllVersions}>
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
        return hoveredVersion && hoveredVersion !== version;
    };

    return (
        <Flex gap={2} direction={'column'} className={b(null)} wrap>
            <Flex className={b('bar')} grow={1} gap={0.5}>
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
                        placement={'top-start'}
                        openDelay={TOOLTIP_OPEN_DELAY}
                    >
                        <span
                            onMouseEnter={() => {
                                handleMouseEnter(item.version);
                            }}
                            onMouseLeave={handleMouseLeave}
                            className={b('version', {dimmed: isDimmed(item.version)})}
                            style={{backgroundColor: item.color, width: `${item.value}%`}}
                        />
                    </Tooltip>
                ))}
            </Flex>

            <Flex gap={0.5} direction={'column'}>
                {truncatedDisplayedVersions.map((item) => (
                    <Tooltip
                        key={item.version}
                        content={i18n('tooltip_nodes', {count: item.count})}
                        placement={'bottom-end'}
                        openDelay={TOOLTIP_OPEN_DELAY}
                    >
                        <Flex gap={1} alignItems={'center'} className={b('titles-wrapper')}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="6"
                                height="6"
                                viewBox="0 0 6 6"
                                fill="none"
                                className={b('version-icon', {dimmed: isDimmed(item.version)})}
                            >
                                <circle cx="3" cy="3" r="3" fill={item.color} />
                            </svg>
                            <div
                                className={b('title', {dimmed: isDimmed(item.version)})}
                                onMouseEnter={() => {
                                    handleMouseEnter(item.version);
                                }}
                                onMouseLeave={handleMouseLeave}
                            >
                                {item.version}
                            </div>
                        </Flex>
                    </Tooltip>
                ))}
                <Flex>{renderButton()}</Flex>
            </Flex>
        </Flex>
    );
}

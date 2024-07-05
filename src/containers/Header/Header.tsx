import React from 'react';

import {Breadcrumbs} from '@gravity-ui/uikit';
import {get} from 'lodash';
import {useLocation} from 'react-router-dom';

import {InternalLink} from '../../components/InternalLink';
import {LinkWithIcon} from '../../components/LinkWithIcon/LinkWithIcon';
import {parseQuery} from '../../routes';
import {backend, customBackend} from '../../store';
import {clusterApi} from '../../store/reducers/cluster/cluster';
import {cn} from '../../utils/cn';
import {DEVELOPER_UI_TITLE} from '../../utils/constants';
import {useTypedSelector} from '../../utils/hooks';

import type {RawBreadcrumbItem} from './breadcrumbs';
import {getBreadcrumbs} from './breadcrumbs';

import './Header.scss';

const b = cn('header');

const getInternalLink = (singleClusterMode: boolean) => {
    if (singleClusterMode && !customBackend) {
        return `/internal`;
    }

    return backend + '/internal';
};

interface HeaderProps {
    mainPage?: RawBreadcrumbItem;
}

function Header({mainPage}: HeaderProps) {
    const location = useLocation();
    const queryParams = parseQuery(location);

    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);

    const clusterInfo = clusterApi.useGetClusterInfoQuery(
        queryParams.clusterName ? String(queryParams.clusterName) : undefined,
    );

    const clusterName = get(
        clusterInfo,
        ['currentData', 'clusterData', 'Name'],
        queryParams.clusterName,
    );

    const breadcrumbItems = React.useMemo(() => {
        const rawBreadcrumbs: RawBreadcrumbItem[] = [];
        let options = pageBreadcrumbsOptions;

        if (mainPage) {
            rawBreadcrumbs.push(mainPage);
        }

        if (clusterName) {
            options = {
                ...options,
                clusterName,
            };
        }

        const breadcrumbs = getBreadcrumbs(page, options, rawBreadcrumbs, queryParams);

        return breadcrumbs.map((item) => {
            return {...item, action: () => {}};
        });
    }, [clusterName, mainPage, queryParams, page, pageBreadcrumbsOptions]);

    const renderHeader = () => {
        return (
            <header className={b()}>
                <Breadcrumbs
                    items={breadcrumbItems}
                    lastDisplayedItemsCount={1}
                    firstDisplayedItemsCount={1}
                    className={b('breadcrumbs')}
                    renderItem={({item, isCurrent}) => {
                        const {icon, text, link} = item;

                        return (
                            <InternalLink
                                className={b('breadcrumbs-item', {
                                    active: isCurrent,
                                    link: !isCurrent,
                                })}
                                to={isCurrent ? undefined : link}
                            >
                                {icon ? (
                                    <span className={b('breadcrumbs-icon')}>{icon}</span>
                                ) : null}
                                <span>{text}</span>
                            </InternalLink>
                        );
                    }}
                />

                <LinkWithIcon title={DEVELOPER_UI_TITLE} url={getInternalLink(singleClusterMode)} />
            </header>
        );
    };
    return renderHeader();
}

export default Header;

import React from 'react';

import {Breadcrumbs} from '@gravity-ui/uikit';
import {get} from 'lodash';
import {useHistory, useLocation} from 'react-router';

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
    const history = useHistory();
    const location = useLocation();
    const queryParams = parseQuery(location);

    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);

    const clusterInfo = clusterApi.useGetClusterInfoQuery(queryParams.clusterName);

    const clusterName = get(
        clusterInfo,
        ['currentData', 'clusterData', 'Name'],
        queryParams.clusterName,
    );

    const breadcrumbItems = React.useMemo(() => {
        const rawBreadcrumbs: RawBreadcrumbItem[] = [];
        const options = pageBreadcrumbsOptions;

        if (mainPage) {
            rawBreadcrumbs.push(mainPage);
        }

        if (clusterName) {
            options.clusterName = clusterName;
        }

        const breadcrumbs = getBreadcrumbs(page, options, rawBreadcrumbs, queryParams);

        return breadcrumbs.map((item) => {
            return {...item, action: () => {}};
        });
    }, [clusterName, mainPage, history, queryParams, page, pageBreadcrumbsOptions]);

    const renderHeader = () => {
        return (
            <header className={b()}>
                <div>
                    <Breadcrumbs
                        items={breadcrumbItems}
                        lastDisplayedItemsCount={1}
                        firstDisplayedItemsCount={1}
                        renderItem={({item, isCurrent}) => {
                            const {icon, text, link} = item;

                            const content = icon ? (
                                <span className={b('breadcrumb')}>
                                    <div className={b('breadcrumb__icon')}>{icon}</div>
                                    {text}
                                </span>
                            ) : (
                                text
                            );

                            return (
                                <InternalLink to={isCurrent ? undefined : link}>
                                    {content}
                                </InternalLink>
                            );
                        }}
                    />
                </div>

                <LinkWithIcon title={DEVELOPER_UI_TITLE} url={getInternalLink(singleClusterMode)} />
            </header>
        );
    };
    return renderHeader();
}

export default Header;

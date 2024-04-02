import React from 'react';

import {Link as ExternalLink} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {useLocation, useParams} from 'react-router';

import {EmptyState} from '../../components/EmptyState';
import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Icon} from '../../components/Icon';
import {Loader} from '../../components/Loader';
import {Tag} from '../../components/Tag';
import {parseQuery} from '../../routes';
import {backend} from '../../store';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {clearTabletData, getTablet, getTabletDescribe} from '../../store/reducers/tablet';
import type {EType} from '../../types/api/tablet';
import {cn} from '../../utils/cn';
import {CLUSTER_DEFAULT_TITLE, DEVELOPER_UI_TITLE} from '../../utils/constants';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {TabletControls} from './TabletControls';
import {TabletInfo} from './TabletInfo';
import {TabletTable} from './TabletTable';
import i18n from './i18n';

import './Tablet.scss';

export const b = cn('tablet-page');

export const Tablet = () => {
    const isFirstDataFetchRef = React.useRef(true);

    const dispatch = useTypedDispatch();
    const location = useLocation();

    const params = useParams<{id: string}>();
    const {id} = params;

    const {
        data: tablet = {},
        loading,
        id: tabletId,
        history = [],
        tenantPath,
        error,
    } = useTypedSelector((state) => state.tablet);

    const {
        nodeId: queryNodeId,
        tenantName: queryTenantName,
        type: queryTabletType,
        clusterName: queryClusterName,
    } = parseQuery(location);
    const nodeId = tablet.NodeId?.toString() || queryNodeId?.toString();
    const tenantName = tenantPath || queryTenantName?.toString();
    const type = tablet.Type || (queryTabletType?.toString() as EType | undefined);

    // NOTE: should be reviewed when migrating to React 18
    React.useEffect(() => {
        return () => {
            dispatch(clearTabletData());
        };
    }, [dispatch]);

    React.useEffect(() => {
        if (isFirstDataFetchRef.current && tablet && tablet.TenantId) {
            dispatch(getTabletDescribe(tablet.TenantId));
            isFirstDataFetchRef.current = false;
        }
    }, [dispatch, tablet]);

    const fetchData = React.useCallback(() => {
        return dispatch(getTablet(id));
    }, [dispatch, id]);

    useAutofetcher(fetchData, [fetchData], true);

    React.useEffect(() => {
        dispatch(
            setHeaderBreadcrumbs('tablet', {
                nodeIds: nodeId ? [nodeId] : [],
                tenantName,
                tabletId: id,
                tabletType: type,
            }),
        );
    }, [dispatch, tenantName, id, nodeId, type]);

    const renderExternalLinks = (link: {name: string; path: string}, index: number) => {
        return (
            <li key={index} className={b('link', {external: true})}>
                <ExternalLink href={`${backend}${link.path}`} target="_blank">
                    {link.name}
                </ExternalLink>
            </li>
        );
    };

    const renderView = () => {
        if (loading && id !== tabletId && isFirstDataFetchRef.current) {
            return <Loader size="l" />;
        }

        if (error) {
            return <ResponseError error={error} />;
        }

        if (!tablet || !Object.keys(tablet).length) {
            return (
                <div className={b('placeholder')}>
                    <EmptyState title={i18n('emptyState')} />
                </div>
            );
        }

        const {TabletId, Overall, Leader} = tablet;

        const externalLinks = [
            {
                name: `${DEVELOPER_UI_TITLE} - tablet`,
                path: `/tablets?TabletID=${TabletId}`,
            },
        ];

        return (
            <div className={b()}>
                <div className={b('pane-wrapper')}>
                    <div className={b('left-pane')}>
                        <ul className={b('links')}>{externalLinks.map(renderExternalLinks)}</ul>
                        <div className={b('row', {header: true})}>
                            <span className={b('title')}>{i18n('tablet.header')}</span>
                            <EntityStatus status={Overall} name={TabletId} />
                            <a
                                rel="noopener noreferrer"
                                className={b('link', {external: true})}
                                href={`${backend}/tablets?TabletID=${TabletId}`}
                                target="_blank"
                            >
                                <Icon name="external" />
                            </a>
                            {Leader && <Tag text="Leader" type="blue" />}
                            <span className={b('loader')}>{loading && <Loader size="s" />}</span>
                        </div>
                        <TabletInfo tablet={tablet} tenantPath={tenantName} />
                        <TabletControls tablet={tablet} fetchData={fetchData} />
                    </div>
                    <div className={b('rigth-pane')}>
                        <TabletTable history={history} />
                    </div>
                </div>
            </div>
        );
    };
    return (
        <React.Fragment>
            <Helmet>
                <title>{`${id} — ${i18n('tablet.header')} — ${
                    tenantName || queryClusterName || CLUSTER_DEFAULT_TITLE
                }`}</title>
            </Helmet>
            {renderView()}
        </React.Fragment>
    );
};

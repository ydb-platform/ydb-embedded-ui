import {useCallback, useEffect, useRef} from 'react';
import {useParams} from 'react-router';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';
import {Link as ExternalLink} from '@gravity-ui/uikit';

import {backend} from '../../store';
import {getTablet, getTabletDescribe} from '../../store/reducers/tablet';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import '../../services/api';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Tag} from '../../components/Tag';
import {Icon} from '../../components/Icon';
import {EmptyState} from '../../components/EmptyState';
import {Loader} from '../../components/Loader';

import {TabletTable} from './TabletTable';
import {TabletInfo} from './TabletInfo';
import {TabletControls} from './TabletControls';

import i18n from './i18n';

import './Tablet.scss';

export const b = cn('tablet-page');

export const Tablet = () => {
    const isFirstDataFetchRef = useRef(true);

    const dispatch = useDispatch();

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

    useEffect(() => {
        if (isFirstDataFetchRef.current && tablet && tablet.TenantId) {
            dispatch(getTabletDescribe(tablet.TenantId));
            isFirstDataFetchRef.current = false;
        }
    }, [dispatch, tablet]);

    const fetchData = useCallback(() => {
        dispatch(getTablet(id));
    }, [dispatch, id]);

    useAutofetcher(fetchData, [fetchData], true);

    const renderExternalLinks = (link: {name: string; path: string}, index: number) => {
        return (
            <li key={index} className={b('link', {external: true})}>
                <ExternalLink href={`${backend}${link.path}`} target="_blank">
                    {link.name}
                </ExternalLink>
            </li>
        );
    };

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
            name: 'Internal viewer - tablet',
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
                    </div>
                    <TabletInfo tablet={tablet} tenantPath={tenantPath} />
                    <TabletControls tablet={tablet} />
                </div>
                <div className={b('rigth-pane')}>
                    <TabletTable history={history} />
                </div>
            </div>
        </div>
    );
};

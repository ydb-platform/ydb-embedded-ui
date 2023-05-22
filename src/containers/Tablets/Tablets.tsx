import {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';
import ReactList from 'react-list';

import {Select} from '@gravity-ui/uikit';

import {Tablet} from '../../components/Tablet';
import TabletsOverall from '../../components/TabletsOverall/TabletsOverall';
import {Loader} from '../../components/Loader';

import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import {ETabletState, EType, TTabletStateInfo} from '../../types/api/tablet';

import {
    getTabletsInfo,
    clearWasLoadingFlag,
    setStateFilter,
    setTypeFilter,
} from '../../store/reducers/tablets';

import './Tablets.scss';

import i18n from './i18n';

const b = cn('tablets');

interface TabletsProps {
    path?: string;
    nodeId?: string | number;
    className?: string;
}

export const Tablets = ({path, nodeId, className}: TabletsProps) => {
    const dispatch = useDispatch();

    const {
        data = {},
        wasLoaded,
        loading,
        error,
        stateFilter,
        typeFilter,
    } = useTypedSelector((state) => state.tablets);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const tablets = useMemo(() => data?.TabletStateInfo || [], [data]);

    const fetchData = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(clearWasLoadingFlag());
            }
            if (nodeId) {
                dispatch(getTabletsInfo({nodes: [String(nodeId)]}));
            } else if (path) {
                dispatch(getTabletsInfo({path}));
            }
        },
        [path, nodeId, dispatch],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const [tabletsToRender, setTabletsToRender] = useState<TTabletStateInfo[]>([]);

    useEffect(() => {
        let filteredTablets = tablets;

        if (typeFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tablet) =>
                typeFilter.some((filter) => tablet.Type === filter),
            );
        }
        if (stateFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tablet) =>
                stateFilter.some((filter) => tablet.State === filter),
            );
        }
        setTabletsToRender(filteredTablets);
    }, [tablets, stateFilter, typeFilter]);

    const handleStateFilterChange = (value: string[]) => {
        dispatch(setStateFilter(value as ETabletState[]));
    };

    const handleTypeFilterChange = (value: string[]) => {
        dispatch(setTypeFilter(value as EType[]));
    };

    const renderTablet = (tabletIndex: number) => {
        return <Tablet tablet={tabletsToRender[tabletIndex]} key={tabletIndex} />;
    };

    const renderContent = () => {
        const states = Array.from(new Set(tablets.map((tablet) => tablet.State)))
            .filter((state): state is ETabletState => state !== undefined)
            .map((item) => ({
                value: item,
                content: item,
            }));
        const types = Array.from(new Set(tablets.map((tablet) => tablet.Type)))
            .filter((type): type is EType => type !== undefined)
            .map((item) => ({
                value: item,
                content: item,
            }));

        return (
            <div className={b(null, className)}>
                <div className={b('header')}>
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder={i18n('controls.allItems')}
                        label={`${i18n('controls.state')}:`}
                        options={states}
                        value={stateFilter}
                        onUpdate={handleStateFilterChange}
                    />
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder={i18n('controls.allItems')}
                        label={`${i18n('controls.type')}:`}
                        options={types}
                        value={typeFilter}
                        onUpdate={handleTypeFilterChange}
                    />
                    <TabletsOverall tablets={tablets} />
                </div>

                <div className={b('items')}>
                    <ReactList
                        itemRenderer={renderTablet}
                        length={tabletsToRender.length}
                        type="uniform"
                    />
                </div>
            </div>
        );
    };

    if (loading && !wasLoaded) {
        return <Loader />;
    } else if (error) {
        return <div className="error">{error.statusText}</div>;
    } else {
        return tablets.length > 0 ? (
            renderContent()
        ) : (
            <div className="error">{i18n('noTabletsData')}</div>
        );
    }
};

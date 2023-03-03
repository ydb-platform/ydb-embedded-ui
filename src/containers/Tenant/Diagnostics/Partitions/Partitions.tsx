import block from 'bem-cn-lite';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch} from 'react-redux';
import {escapeRegExp} from 'lodash/fp';

import DataTable from '@gravity-ui/react-data-table';
import {Select, TableColumnSetup} from '@gravity-ui/uikit';
import {TableColumnSetupItem} from '@gravity-ui/uikit/build/esm/components/Table/hoc/withTableSettings/withTableSettings';

import type {EPathType} from '../../../../types/api/schema';

import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {DEFAULT_TABLE_SETTINGS, PARTITIONS_SELECTED_COLUMNS_KEY} from '../../../../utils/constants';

import {getSettingValue, setSettingValue} from '../../../../store/reducers/settings';
import {
    getConsumer,
    selectPreparedPartitionsData,
    setDataWasNotLoaded,
    setSelectedConsumer,
} from '../../../../store/reducers/consumer';

import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {Search} from '../../../../components/Search';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {isCdcStreamEntityType} from '../../utils/schema';

import type {IPreparedPartitionDataWithHosts} from './utils/types';
import {
    PARTITIONS_COLUMNS_IDS,
    PARTITIONS_COLUMNS_TITILES,
    PARTITIONS_DEFAULT_SELECTED_COLUMNS,
} from './utils/constants';

import {columns as partitionsColumns} from './columns';

import i18n from './i18n';

import './Partitions.scss';

export const b = block('ydb-diagnostics-partitions');

interface PartitionsProps {
    path?: string;
    type?: EPathType;
    nodes?: Record<number, string>;
    consumers?: string[];
}

export const Partitions = ({path, type, nodes, consumers}: PartitionsProps) => {
    const isCdcStream = isCdcStreamEntityType(type);

    const dispatch = useDispatch();

    const [generalSearchValue, setGeneralSearchValue] = useState('');
    const [partitionIdSearchValue, setPartitionIdSearchValue] = useState('');

    const [componentCurrentPath, setComponentCurrentPath] = useState(path);

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {loading, wasLoaded, error, selectedConsumer} = useTypedSelector(
        (state) => state.consumer,
    );

    const partitions = useTypedSelector((state) => selectPreparedPartitionsData(state));

    const savedSelectedColumns: string = useTypedSelector((state) =>
        getSettingValue(state, PARTITIONS_SELECTED_COLUMNS_KEY),
    );

    useEffect(() => {
        // Manual path control to ensure it updates with other values so no request with wrong params will be sent
        setComponentCurrentPath(path);
    }, [dispatch, path]);

    const fetchConsumerData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            if (selectedConsumer && consumers && consumers.includes(selectedConsumer)) {
                dispatch(getConsumer(componentCurrentPath, selectedConsumer));
            }
        },
        [dispatch, selectedConsumer, componentCurrentPath, consumers],
    );

    useAutofetcher(fetchConsumerData, [fetchConsumerData], autorefresh);

    const consumersToSelect = useMemo(
        () =>
            consumers
                ? consumers.map((consumer) => ({
                      value: consumer,
                      content: consumer,
                  }))
                : undefined,
        [consumers],
    );

    useEffect(() => {
        const shouldUpdateSelectedConsumer =
            !selectedConsumer || (consumers && !consumers.includes(selectedConsumer));

        if (consumersToSelect && consumersToSelect.length && shouldUpdateSelectedConsumer) {
            dispatch(setSelectedConsumer(consumersToSelect[0].value));
        }
    }, [dispatch, consumersToSelect, selectedConsumer, consumers]);

    const selectedColumns: string[] = useMemo(
        () =>
            savedSelectedColumns
                ? JSON.parse(savedSelectedColumns)
                : PARTITIONS_DEFAULT_SELECTED_COLUMNS,
        [savedSelectedColumns],
    );

    const columnsToSelect = useMemo(() => {
        return Object.values(PARTITIONS_COLUMNS_IDS).map((id) => {
            return {
                title: PARTITIONS_COLUMNS_TITILES[id],
                selected: Boolean(selectedColumns?.includes(id)),
                id: id,
                required: id === PARTITIONS_COLUMNS_IDS.PARTITION_ID,
            };
        });
    }, [selectedColumns]);

    const columnsToShow = useMemo(() => {
        return partitionsColumns.filter((column) => selectedColumns?.includes(column.name));
    }, [selectedColumns]);

    const partitionsWithHosts: IPreparedPartitionDataWithHosts[] | undefined = useMemo(() => {
        return partitions?.map((partition) => {
            const partitionHost =
                partition.partitionNodeId && nodes ? nodes[partition.partitionNodeId] : undefined;

            const connectionHost =
                partition.connectionNodeId && nodes ? nodes[partition.connectionNodeId] : undefined;

            return {
                ...partition,
                partitionHost,
                connectionHost,
            };
        });
    }, [partitions, nodes]);

    const dataToRender = useMemo(() => {
        if (!partitionsWithHosts) {
            return [];
        }

        const partitionIdRe = new RegExp(escapeRegExp(partitionIdSearchValue), 'i');
        const generalRe = new RegExp(escapeRegExp(generalSearchValue), 'i');

        return partitionsWithHosts.filter((partition) => {
            const {
                partitionId,
                readerName = '',
                readSessionId = '',
                partitionNodeId,
                connectionNodeId,
                partitionHost = '',
                connectionHost = '',
            } = partition;

            const isPartitionIdMatch = partitionIdRe.test(partitionId);
            const isOtherValuesMatch =
                generalRe.test(readerName) ||
                generalRe.test(readSessionId) ||
                generalRe.test(String(partitionNodeId)) ||
                generalRe.test(String(connectionNodeId)) ||
                generalRe.test(partitionHost) ||
                generalRe.test(connectionHost);

            return isPartitionIdMatch && isOtherValuesMatch;
        });
    }, [partitionIdSearchValue, generalSearchValue, partitionsWithHosts]);

    const hadleTableColumnsSetupChange = (value: TableColumnSetupItem[]) => {
        const columns = value.filter((el) => el.selected).map((el) => el.id);
        dispatch(setSettingValue(PARTITIONS_SELECTED_COLUMNS_KEY, JSON.stringify(columns)));
    };

    const handleConsumerSelectChange = (value: string[]) => {
        dispatch(setSelectedConsumer(value[0]));
    };

    const handlePartitionIdSearchChange = (value: string) => {
        setPartitionIdSearchValue(value);
    };

    const handleGeneralSearchChange = (value: string) => {
        setGeneralSearchValue(value);
    };

    if (error) {
        return <ResponseError error={error} />;
    }

    if (!consumersToSelect || !consumersToSelect.length) {
        return <div>{i18n(`noConsumersMessage.${isCdcStream ? 'stream' : 'topic'}`)}</div>;
    }

    return (
        <div className={b()}>
            <div className={b('controls')}>
                <Select
                    className={b('consumer-select')}
                    placeholder={i18n('controls.consumerSelector.placeholder')}
                    label={i18n('controls.consumerSelector')}
                    options={consumersToSelect}
                    value={[selectedConsumer || '']}
                    onUpdate={handleConsumerSelectChange}
                    filterable={consumers && consumers.length > 5}
                />
                <Search
                    onChange={handlePartitionIdSearchChange}
                    placeholder={i18n('controls.partitionSearch')}
                    className={b('search', {partition: true})}
                    value={partitionIdSearchValue}
                />
                <Search
                    onChange={handleGeneralSearchChange}
                    placeholder={i18n('controls.generalSearch')}
                    className={b('search', {general: true})}
                    value={generalSearchValue}
                />
                <TableColumnSetup
                    key="TableColumnSetup"
                    popupWidth="242px"
                    items={columnsToSelect}
                    showStatus
                    onUpdate={hadleTableColumnsSetupChange}
                    className={b('table-settings')}
                />
            </div>
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>
                    {loading && !wasLoaded ? (
                        <TableSkeleton className={b('loader')} />
                    ) : (
                        <DataTable
                            theme="yandex-cloud"
                            data={dataToRender}
                            columns={columnsToShow}
                            settings={DEFAULT_TABLE_SETTINGS}
                            emptyDataMessage={i18n('table.emptyDataMessage')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

import React from 'react';

import {SegmentedRadioGroup} from '@gravity-ui/uikit';
import {StringParam, useQueryParam} from 'use-query-params';
import {z} from 'zod';

import type {DateRangeValues} from '../../../../components/DateRange';
import {setTopQueriesFilters} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {TimeFrame} from '../../../../store/reducers/executeTopQueries/types';
import {useTypedDispatch} from '../../../../utils/hooks';

import {RunningQueriesData} from './RunningQueriesData';
import {TopQueriesData} from './TopQueriesData';
import {TimeFrameIds} from './constants';
import i18n from './i18n';

import './TopQueries.scss';

const QueryModeIds = {
    top: 'top',
    running: 'running',
} as const;

const queryModeSchema = z.nativeEnum(QueryModeIds).catch(QueryModeIds.top);
const timeFrameSchema = z.nativeEnum(TimeFrameIds).catch(TimeFrameIds.hour);

interface TopQueriesProps {
    tenantName: string;
}

export const TopQueries = ({tenantName}: TopQueriesProps) => {
    const dispatch = useTypedDispatch();
    const [rawQueryMode = QueryModeIds.top, setQueryMode] = useQueryParam('queryMode', StringParam);
    const [rawTimeFrame = TimeFrameIds.hour, setTimeFrame] = useQueryParam(
        'timeFrame',
        StringParam,
    );

    const queryMode = queryModeSchema.parse(rawQueryMode);
    const timeFrame = timeFrameSchema.parse(rawTimeFrame);

    const isTopQueries = queryMode === QueryModeIds.top;

    const handleTextSearchUpdate = (text: string) => {
        dispatch(setTopQueriesFilters({text}));
    };

    const handleTimeFrameChange = (value: string[]) => {
        setTimeFrame(value[0] as TimeFrame, 'replaceIn');
    };

    const handleDateRangeChange = (value: DateRangeValues) => {
        dispatch(setTopQueriesFilters(value));
    };

    const renderQueryModeControl = React.useCallback(() => {
        return (
            <SegmentedRadioGroup value={queryMode} onUpdate={setQueryMode}>
                <SegmentedRadioGroup.Option value={QueryModeIds.top}>
                    {i18n('mode_top')}
                </SegmentedRadioGroup.Option>
                <SegmentedRadioGroup.Option value={QueryModeIds.running}>
                    {i18n('mode_running')}
                </SegmentedRadioGroup.Option>
            </SegmentedRadioGroup>
        );
    }, [queryMode, setQueryMode]);

    return isTopQueries ? (
        <TopQueriesData
            tenantName={tenantName}
            timeFrame={timeFrame}
            renderQueryModeControl={renderQueryModeControl}
            handleTimeFrameChange={handleTimeFrameChange}
            handleDateRangeChange={handleDateRangeChange}
            handleTextSearchUpdate={handleTextSearchUpdate}
        />
    ) : (
        <RunningQueriesData
            tenantName={tenantName}
            renderQueryModeControl={renderQueryModeControl}
            handleTextSearchUpdate={handleTextSearchUpdate}
        />
    );
};

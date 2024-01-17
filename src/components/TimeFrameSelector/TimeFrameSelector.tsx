import {Button} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {TIMEFRAMES, type TimeFrame} from '../../utils/timeframes';

import './TimeFrameSelector.scss';

const b = cn('ydb-timeframe-selector');

interface TimeFrameSelectorProps {
    value: TimeFrame;
    onChange: (value: TimeFrame) => void;
    className?: string;
}

export const TimeFrameSelector = ({value, onChange, className}: TimeFrameSelectorProps) => {
    return (
        <div className={b(null, className)}>
            {Object.keys(TIMEFRAMES).map((timeFrame) => {
                return (
                    <Button
                        view="flat"
                        selected={value === timeFrame}
                        key={timeFrame}
                        onClick={() => onChange(timeFrame as TimeFrame)}
                    >
                        {timeFrame}
                    </Button>
                );
            })}
        </div>
    );
};

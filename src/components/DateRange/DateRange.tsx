import {cn} from '../../utils/cn';

import './DateRange.scss';

const b = cn('date-range');

export interface DateRangeValues {
    /** ms from epoch */
    from?: number;
    /** ms from epoch */
    to?: number;
}

interface DateRangeProps extends DateRangeValues {
    className?: string;
    onChange?: (value: DateRangeValues) => void;
}

const toTimezonelessISOString = (timestamp?: number) => {
    if (!timestamp || isNaN(timestamp)) {
        return undefined;
    }

    // shift by local offset to treat toISOString output as local time
    const shiftedTimestamp = timestamp - new Date().getTimezoneOffset() * 60 * 1000;
    return new Date(shiftedTimestamp).toISOString().substring(0, 'yyyy-MM-DDThh:mm'.length);
};

export const DateRange = ({from, to, className, onChange}: DateRangeProps) => {
    const handleFromChange: React.ChangeEventHandler<HTMLInputElement> = ({target: {value}}) => {
        let newFrom = value ? new Date(value).getTime() : undefined;

        // some browsers allow selecting time after the boundary specified in `max`
        if (newFrom && to && newFrom > to) {
            newFrom = to;
        }

        onChange?.({from: newFrom, to});
    };

    const handleToChange: React.ChangeEventHandler<HTMLInputElement> = ({target: {value}}) => {
        let newTo = value ? new Date(value).getTime() : undefined;

        // some browsers allow selecting time before the boundary specified in `min`
        if (from && newTo && from > newTo) {
            newTo = from;
        }

        onChange?.({from, to: newTo});
    };

    const startISO = toTimezonelessISOString(from);
    const endISO = toTimezonelessISOString(to);

    return (
        <div className={b(null, className)}>
            <input
                type="datetime-local"
                value={startISO || ''}
                max={endISO}
                onChange={handleFromChange}
                className={b('input')}
            />
            —
            <input
                type="datetime-local"
                min={startISO}
                value={endISO || ''}
                onChange={handleToChange}
                className={b('input')}
            />
        </div>
    );
};

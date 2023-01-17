import cn from 'bem-cn-lite';
import {useMemo} from 'react';

import './VerticalBars.scss';

const b = cn('ydb-bars');

const calculateValuesInPercents = (values: number[]) => {
    const max = Math.max(...values);

    if (!max) {
        return values;
    }

    const res = [];

    for (const value of values) {
        res.push((value / max) * 100);
    }

    return res;
};

interface VerticalBarsProps {
    values: number[];
}

export const VerticalBars = ({values}: VerticalBarsProps) => {
    const preparedValues = useMemo(() => calculateValuesInPercents(values), [values]);

    const getBars = () => {
        return preparedValues.map((value, index) => {
            return <div key={index} style={{height: `${value}%`}} className={b('value')} />;
        });
    };

    return <div className={b()}>{getBars()}</div>;
};

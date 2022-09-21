import PropTypes from 'prop-types';

import {RadioButton} from '@gravity-ui/uikit';

import {ALL, PROBLEMS} from '../../utils/constants';

export default function ProblemFilter(props) {
    const {value, onChange, className} = props;

    return (
        <RadioButton value={value} onUpdate={(value) => onChange(value)} className={className}>
            <RadioButton.Option value={ALL}>{ALL}</RadioButton.Option>
            <RadioButton.Option value={PROBLEMS}>{PROBLEMS}</RadioButton.Option>
        </RadioButton>
    );
}

export const problemFilterType = PropTypes.oneOf([ALL, PROBLEMS]);

ProblemFilter.propTypes = {
    value: problemFilterType,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

import React from 'react';
import cn from 'bem-cn-lite';
import './ProgressViewer.scss';
import PropTypes from 'prop-types';
const b = cn('progress-viewer');
/*

Описание props:
1) value - величина прогресса
2) capacity - предельно возможный прогресс
3) formatValues - функция форматирования value и capacity
4) percents - отображать ли заполненость в виде процентов
5) className - кастомный класс
6) colorizeProgress - менять ли цвет полосы прогресса в зависимости от его величины
7) inverseColorize - инвертировать ли цвета при разукрашивании прогресса
*/
export class ProgressViewer extends React.Component {
    static propTypes = {
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        capacity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        formatValues: PropTypes.func,
        percents: PropTypes.bool,
        className: PropTypes.string,
        size: PropTypes.oneOf(['xs', 's', 'ns', 'm', 'n', 'l', 'head']),
        colorizeProgress: PropTypes.bool,
        inverseColorize: PropTypes.bool,
    };

    static defaultProps = {
        size: 'xs',
        colorizeProgress: false,
        capacity: 100,
        inverseColorize: false,
    };

    render() {
        const {
            value,
            capacity,
            formatValues,
            percents,
            size,
            className,
            colorizeProgress,
            inverseColorize,
        } = this.props;

        let fillWidth = Math.round((parseFloat(value) / parseFloat(capacity)) * 100);
        fillWidth = fillWidth > 100 ? 100 : fillWidth;

        let valueText = Math.round(value),
            capacityText = capacity,
            divider = '/';
        if (formatValues) {
            [valueText, capacityText] = formatValues(value, capacity);
        } else if (percents) {
            valueText = fillWidth + '%';
            capacityText = '';
            divider = '';
        }

        let bg = inverseColorize ? 'scarlet' : 'apple';
        if (colorizeProgress) {
            if (fillWidth > 60 && fillWidth <= 80) {
                bg = 'saffron';
            } else if (fillWidth > 80) {
                bg = inverseColorize ? 'apple' : 'scarlet';
            }
        }

        const lineStyle = {
            width: fillWidth + '%',
        };

        const text = fillWidth > 60 ? 'contrast0' : 'contrast70';

        if (!isNaN(fillWidth)) {
            return (
                <div className={b({size})}>
                    <div className={b('line', {bg})} style={lineStyle}></div>
                    <span className={b('text', {text})}>
                        {`${valueText} ${divider} ${capacityText}`}
                    </span>
                </div>
            );
        }

        return <div className={`${b({size})} ${className} error`}>no data</div>;
    }
}

export default ProgressViewer;

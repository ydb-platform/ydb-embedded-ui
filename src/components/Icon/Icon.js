import PropTypes from 'prop-types';
import {Icon as UiKitIcon} from '@yandex-cloud/uikit';

export default function Icon({name, height, width, viewBox, className, onClick}) {
    return (
        <UiKitIcon
            data={{id: `icon.${name}`, viewBox}}
            height={height}
            width={width}
            className={className}
            onClick={onClick}
        />
    );
}

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    height: PropTypes.number,
    width: PropTypes.number,
    viewBox: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func,
};
Icon.defaultProps = {
    height: 16,
    width: 16,
    viewBox: '0 0 16 16',
};

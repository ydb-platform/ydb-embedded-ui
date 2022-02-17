import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import './InfoViewer.scss';

const b = cn('info-viewer');

class InfoViewer extends React.Component {
    render() {
        const {info, className, title} = this.props;

        return (
            <div className={`${b()} ${className}`}>
                {title && <div className={b('title')}>{title}</div>}
                {info && info.length > 0 ? (
                    <div className={b('items')}>
                        {info.map((data, infoIndex) => (
                            <div className={b('row')} key={infoIndex}>
                                <div className={b('label')}>
                                    {data.label}
                                    <div className={b('dots')}></div>
                                </div>

                                <div className={b('value')}>{data.value}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>no {title} data</div>
                )}
            </div>
        );
    }
}

InfoViewer.propTypes = {
    className: PropTypes.string,
    info: PropTypes.array.isRequired,
    title: PropTypes.string,
    dots: PropTypes.bool,
};

InfoViewer.defaultProps = {
    className: '',
};

export default InfoViewer;

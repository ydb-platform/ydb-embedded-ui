import React from 'react';

import {Popup, useVirtualElementRef} from '@gravity-ui/uikit';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {hideTooltip} from '../../store/reducers/tooltip';
import {tooltipTemplates} from '../../utils/tooltip';

import './ReduxTooltip.scss';

const propTypes = {
    className: PropTypes.string,
    toolTipVisible: PropTypes.bool,
    currentHoveredRef: PropTypes.object,
    data: PropTypes.any,
    template: PropTypes.func,
    hideTooltip: PropTypes.func,
};

function ReduxTooltip(props) {
    const fakeAnchor = useVirtualElementRef({
        rect: {top: props.positions?.top, left: props.positions?.left},
    });

    const handleScroll = React.useCallback(() => {
        const {hideTooltip, toolTipVisible} = props;
        if (toolTipVisible) {
            setTimeout(() => hideTooltip(), 500);
        }
    }, [props]);

    React.useEffect(() => {
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    const renderPositionPopup = (visible, positions, data, additionalData) => {
        const {template, popupClassName, hideTooltip} = props;

        return (
            <React.Fragment>
                <Popup
                    open={visible}
                    placement={['top', 'bottom', 'left', 'right']}
                    contentClassName={popupClassName}
                    anchorRef={fakeAnchor}
                    onOutsideClick={hideTooltip}
                >
                    {data && template(data, additionalData)}
                </Popup>
            </React.Fragment>
        );
    };
    const renderAnchorPopup = (visible, anchor, data, additionalData) => {
        const {template, popupClassName, hideTooltip} = props;
        return (
            <Popup
                open={visible}
                anchorRef={{current: anchor}}
                hasArrow
                placement={['top', 'bottom', 'left', 'right']}
                className={popupClassName}
                onOutsideClick={hideTooltip}
            >
                {data && template(data, additionalData)}
            </Popup>
        );
    };

    const {
        className = '',
        toolTipVisible,
        currentHoveredRef,
        data,
        additionalData,
        positions,
    } = props;

    return (
        <div className={`redux-tooltip ${className}`}>
            {positions
                ? renderPositionPopup(toolTipVisible, positions, data, additionalData)
                : renderAnchorPopup(toolTipVisible, currentHoveredRef, data, additionalData)}
        </div>
    );
}

const mapStateToProps = (state) => {
    const {toolTipVisible, currentHoveredRef, data, templateType, additionalData, positions} =
        state.tooltip;

    const {popupClassName} = additionalData || {};

    return {
        toolTipVisible,
        currentHoveredRef,
        data,
        template: tooltipTemplates[templateType],
        additionalData,
        positions,
        popupClassName,
    };
};

export default connect(mapStateToProps, {hideTooltip})(ReduxTooltip);

ReduxTooltip.propTypes = propTypes;

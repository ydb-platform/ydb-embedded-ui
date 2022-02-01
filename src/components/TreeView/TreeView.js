import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import TreeViewBase from 'react-treeview';
import Icon from '../Icon/Icon';

import './TreeView.scss';

const b = cn('km-tree-view');

const TreeView = (props) => {
    const {
        children,
        nodeLabel,
        onClick,
        collapsed,
        clickableLabel = false,
        className,
        hasArrow = true,
        ...rest
    } = props;

    const newNodeLabel = (
        <div
            className={b('node-wrapper', {clickable: clickableLabel})}
            onClick={clickableLabel ? onClick : undefined}
        >
            {hasArrow ? (
                <span
                    className={b('arrow-icon', {extended: !collapsed})}
                    onClick={clickableLabel ? undefined : onClick}
                >
                    <Icon name="arrow-right" viewBox="0 0 6 11" width={6} height={11} />
                </span>
            ) : null}
            {nodeLabel}
        </div>
    );

    return (
        <TreeViewBase
            {...rest}
            treeViewClassName={b(null, className)}
            nodeLabel={newNodeLabel}
            collapsed={collapsed}
        >
            {children}
        </TreeViewBase>
    );
};

TreeView.propTypes = {
    children: PropTypes.any,
    nodeLabel: PropTypes.node,
    onClick: PropTypes.func,
    collapsed: PropTypes.bool,
    clickableLabel: PropTypes.bool,
    className: PropTypes.string,
};

export default TreeView;

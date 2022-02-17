import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import TreeView from '../../../../components/TreeView/TreeView';
import SchemaTree from '../../../Tenant/Schema/SchemaTree/SchemaTree';
import Icon from '../../../../components/Icon/Icon';

import {getSchema, setCurrentSchemaPath} from '../../../../store/reducers/schema';
import {getDescribe} from '../../../../store/reducers/describe';
import {getSchemaAcl} from '../../../../store/reducers/schemaAcl';

import './SchemaNode.scss';

const b = cn('schema-node');

export const FOLDERS_TYPE = [
    'EPathTypeDir',
    'EPathTypeSubDomain',
    'EPathTypeExtSubDomain',
    'EPathTypeOlapStore',
];

class SchemaNode extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
        fullPath: PropTypes.string.isRequired,
        getSchema: PropTypes.func.isRequired,
        setCurrentSchemaPath: PropTypes.func,
        currentSchemaPath: PropTypes.string,
    };

    state = {
        collapsed: true,
    };

    schemaNodeRef = React.createRef();

    componentDidMount() {
        const {currentSchemaPath, isRoot} = this.props;
        const schemaPath = this.getSchemaPath();

        if (schemaPath === currentSchemaPath) {
            this.addActiveClass();
        }

        if (
            (currentSchemaPath &&
                currentSchemaPath.startsWith(schemaPath) &&
                currentSchemaPath !== schemaPath) ||
            isRoot
        ) {
            this.setState({collapsed: false});
        }
    }

    getSchemaPath = () => {
        const {data, fullPath, isRoot} = this.props;

        return isRoot ? fullPath : `${fullPath}/${data.Name}`;
    };

    invertCollapsed = () => {
        this.setState({collapsed: !this.state.collapsed});
    };

    setIcon = (data) => {
        const {collapsed} = this.state;
        if (FOLDERS_TYPE.indexOf(data.PathType) !== -1) {
            return collapsed ? (
                <Icon name="folder" viewBox="0 0 13 10" width={14} height={14} />
            ) : (
                <Icon name="openFolder" viewBox="0 0 13 10" width={14} height={14} />
            );
        } else if (data.PathType === 'EPathTypeTable' || data.PathType === 'EPathTypeOlapTable') {
            return <Icon name="table" viewBox="0 0 13 10" width={14} height={14} />;
        }
    };

    addActiveClass = () => {
        const activeClass = 'schema-node_active';
        const currentActiveSchemaNode = document.querySelector(`.${activeClass}`);
        if (currentActiveSchemaNode) {
            currentActiveSchemaNode.classList.remove(activeClass);
        }
        // eslint-disable-next-line react/no-find-dom-node
        const activeNode = ReactDOM.findDOMNode(this);
        if (activeNode) {
            activeNode.classList.add(activeClass);
        }
    };

    handleClick = (e) => {
        const {getSchema, getDescribe, getSchemaAcl, setCurrentSchemaPath} = this.props;
        e.stopPropagation();
        this.addActiveClass();

        const schemaPath = this.getSchemaPath();
        setCurrentSchemaPath(schemaPath);
        getSchema({path: schemaPath});
        getDescribe({path: schemaPath});
        getSchemaAcl({path: schemaPath});
    };

    render() {
        const {data, fullPath, isRoot = false} = this.props;
        const {collapsed} = this.state;

        if (!data) {
            return null;
        }

        const hasArrow = data.PathType !== 'EPathTypeTable';
        const label = (
            <div className={b('label')}>
                {this.setIcon(data)}
                <div className={b('name')}>{data.Name}</div>
            </div>
        );
        return (
            <div onClick={this.handleClick} ref={this.schemaNodeRef}>
                <TreeView
                    nodeLabel={label}
                    collapsed={collapsed}
                    onClick={this.invertCollapsed}
                    hasArrow={hasArrow}
                >
                    <SchemaTree path={isRoot ? fullPath : `${fullPath}/${data.Name}`} />
                </TreeView>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        currentSchemaPath: state.schema.currentSchemaPath,
    };
}

const mapDispatchToProps = {
    getSchema,
    getDescribe,
    getSchemaAcl,
    setCurrentSchemaPath,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchemaNode);

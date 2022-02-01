import React from 'react';
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
import SchemaNodeActions from '../SchemaNodeActions/SchemaNodeActions';
import {isTableType} from '../../Tenant';

const b = cn('schema-node');

export const SUBDOMAIN_FOLDER_TYPE = 'EPathTypeSubDomain';
export const TABLE_TYPE = 'EPathTypeTable';
export const OLAP_TABLE_TYPE = 'EPathTypeOlapTable';

export const FOLDERS_TYPE = ['EPathTypeDir', 'EPathTypeExtSubDomain', 'EPathTypeOlapStore'];

class SchemaNode extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
        fullPath: PropTypes.string.isRequired,
        getSchema: PropTypes.func.isRequired,
        setCurrentSchemaPath: PropTypes.func,
        currentSchemaPath: PropTypes.string,
        isRoot: PropTypes.bool,
    };

    state = {
        collapsed: true,
        active: false,
    };

    schemaNodeRef = React.createRef();

    componentDidMount() {
        const {currentSchemaPath, isRoot} = this.props;
        const schemaPath = this.getSchemaPath();

        if (schemaPath === currentSchemaPath && !this.state.active) {
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

    componentDidUpdate() {
        const {currentSchemaPath} = this.props;
        const schemaPath = this.getSchemaPath();

        if (schemaPath === currentSchemaPath && !this.state.active) {
            this.addActiveClass();
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
        const viewBox = '0 0 16 16';
        const {collapsed} = this.state;
        if (FOLDERS_TYPE.indexOf(data.PathType) !== -1) {
            return collapsed ? (
                <Icon name="folder" viewBox={viewBox} width={16} height={16} />
            ) : (
                <Icon name="openFolder" viewBox={viewBox} width={16} height={16} />
            );
        } else if (data.PathType === TABLE_TYPE || data.PathType === OLAP_TABLE_TYPE) {
            return <Icon name="table" viewBox={viewBox} width={16} height={16} />;
        } else if (data.PathType === SUBDOMAIN_FOLDER_TYPE) {
            return <Icon name="subdomain" viewBox={viewBox} width={16} height={16} />;
        }
    };

    addActiveClass = () => {
        const activeClass = 'schema-node_active';
        const currentActiveSchemaNode = document.querySelector(`.${activeClass}`);
        if (currentActiveSchemaNode) {
            currentActiveSchemaNode.classList.remove(activeClass);
        }
        const activeNode = this.schemaNodeRef.current;
        if (activeNode) {
            this.setState({active: true});
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
        const {data, fullPath, isRoot = false, currentSchemaPath, currentItem = {}} = this.props;
        const {collapsed} = this.state;

        if (!data) {
            return null;
        }
        const currentPathType = currentItem.PathDescription?.Self?.PathType;
        const type = isTableType(currentPathType);

        const hasArrow = data.PathType !== TABLE_TYPE;
        const label = (
            <div className={b('label')}>
                {this.setIcon(data)}
                <div className={b('name-wrapper')}>
                    <div className={b('name')}>{data.Name}</div>
                    <SchemaNodeActions name={currentSchemaPath} isTableType={type} />
                </div>
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
        currentItem: state.schema.currentSchema,
    };
}

const mapDispatchToProps = {
    getSchema,
    getDescribe,
    getSchemaAcl,
    setCurrentSchemaPath,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchemaNode);

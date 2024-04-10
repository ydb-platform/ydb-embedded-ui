import {getMonitoringClusterLink, getMonitoringLink} from '../monitoring';

describe('getMonitoringLink', () => {
    it('should create database monitoring link from JSON', () => {
        const solomonRaw = {
            monitoring_url: 'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards',
            serverless_dashboard: '',
            dedicated_dashboard: 'aol34hftdn7o4fls50sv',
        };
        const solomonString = JSON.stringify(solomonRaw);

        expect(
            getMonitoringLink({
                monitoring: solomonString,
                clusterName: 'global',
                dbName: '/global/audit-trails',
                dbType: 'Database',
            }),
        ).toBe(
            'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards/aol34hftdn7o4fls50sv?p.cluster=global&p.host=cluster&p.slot=static&p.database=/global/audit-trails',
        );
    });
    it('should create cluster monitoring link from JSON', () => {
        const solomonRaw = {
            monitoring_url: 'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards',
            cluster_dashboard: 'aol34hftdn7o4fls50sv',
        };
        const solomonString = JSON.stringify(solomonRaw);

        expect(getMonitoringClusterLink(solomonString, 'clusterName')).toBe(
            'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards/aol34hftdn7o4fls50sv/view?p.cluster=clusterName&p.database=-',
        );
    });
});

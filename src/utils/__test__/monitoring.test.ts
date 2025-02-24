import {getMonitoringClusterLink, getMonitoringLink} from '../monitoring';

describe('getMonitoringLink', () => {
    test('should create database monitoring link from JSON', () => {
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
                dbName: 'database',
                dbType: 'Dedicated',
            }),
        ).toBe(
            'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards/aol34hftdn7o4fls50sv?p.cluster=global&p.host=cluster&p.slot=static&p.database=database',
        );
    });
    test('should create cluster monitoring link from JSON', () => {
        const solomonRaw = {
            monitoring_url: 'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards',
            cluster_dashboard: 'aol34hftdn7o4fls50sv',
        };
        const solomonString = JSON.stringify(solomonRaw);

        expect(getMonitoringClusterLink(solomonString, 'clusterName')).toBe(
            'https://monitoring.test.ai/projects/yc.ydb.ydbaas-cloud/dashboards/aol34hftdn7o4fls50sv/view?p.cluster=clusterName&p.database=-',
        );
    });
    test('should not parse ready to use database monitoring link', () => {
        const solomonRaw = {
            monitoring_url:
                'https://monitoring.test.ai/projects/ydbaas/dashboards/aol34hftdn7o4fls50sv?p.cluster=cluster_name&a=',
        };

        const solomonString = JSON.stringify(solomonRaw);

        expect(
            getMonitoringLink({
                monitoring: solomonString,
                dbName: 'database',
                dbType: 'Dedicated',
            }),
        ).toBe(
            'https://monitoring.test.ai/projects/ydbaas/dashboards/aol34hftdn7o4fls50sv?p.cluster=cluster_name&a=&p.host=cluster&p.slot=static&p.database=database',
        );
    });
    test('should not parse ready to use cluster monitoring link', () => {
        const solomonRaw = {
            monitoring_url:
                'https://monitoring.test.ai/projects/ydbaas/dashboards/aol34hftdn7o4fls50sv/view?p.cluster=cluster_name&a=',
        };

        const solomonString = JSON.stringify(solomonRaw);

        expect(getMonitoringClusterLink(solomonString)).toBe(
            'https://monitoring.test.ai/projects/ydbaas/dashboards/aol34hftdn7o4fls50sv/view?p.cluster=cluster_name&a=&p.database=-',
        );
    });
});

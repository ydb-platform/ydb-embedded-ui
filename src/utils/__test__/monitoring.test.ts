import {getMonitoringLink} from '../monitoring';

describe('getMonitoringLink', () => {
    it('should create link with solomon for Israel version', () => {
        const monitoringRaw = {
            monitoring_url:
                'https://some-monitoring.org/?project=yc.ydb.ydbaas-cloud&cluster=global',
            serverless_dashboard: '',
            dedicated_dashboard: 'ydb-mt-database-overall',
        };
        const monitoringString = JSON.stringify(monitoringRaw);

        expect(
            getMonitoringLink({
                monitoring: monitoringString,
                clusterName: 'global',
                dbName: '/global/yc.ydb.ydbaas-cloud/uvu6j9kjcel12pem7',
                dbType: 'Serverless',
            }),
        ).toBe(
            'https://some-monitoring.org/?project=yc.ydb.ydbaas-cloud&cluster=global&host=cluster&slot=static&database=/global/yc.ydb.ydbaas-cloud/uvu6j9kjcel12pem7&dashboard=',
        );

        expect(
            getMonitoringLink({
                monitoring: monitoringString,
                clusterName: 'global',
                dbName: '/global/audit-trails',
                dbType: 'Database',
            }),
        ).toBe(
            'https://some-monitoring.org/?project=yc.ydb.ydbaas-cloud&cluster=global&host=cluster&slot=static&database=/global/audit-trails&dashboard=ydb-mt-database-overall',
        );
    });
    it('should create link with monitoring for Nebius version', () => {
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
});

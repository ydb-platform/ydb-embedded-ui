import {getVersionsData} from '../clusterVersionColors';

describe('getVersionsData', () => {
    test('orders on-prem builds by numeric build number', () => {
        const versionsDataMap = getVersionsData(
            new Map([[0, new Set(['25.4.1.10', '25.4.1.100'])]]),
        );

        expect(versionsDataMap.get('25.4.1.100')?.minorIndex).toBe(0);
        expect(versionsDataMap.get('25.4.1.10')?.minorIndex).toBe(1);
    });

    test('keeps mixed-format ordering stable across API insertion orders', () => {
        const onPremNewer = '25.4.1.100';
        const onPremOlder = '25.4.1.10';
        const legacy = 'ydb-stable-25-4-1-50';
        const expectedOrder = [onPremNewer, onPremOlder, legacy];
        const insertionOrders = [
            [onPremNewer, onPremOlder, legacy],
            [legacy, onPremOlder, onPremNewer],
            [onPremOlder, onPremNewer, legacy],
        ];

        insertionOrders.forEach((versions) => {
            const versionsDataMap = getVersionsData(new Map([[0, new Set(versions)]]));
            const actualOrder = Array.from(versionsDataMap)
                .sort(([, dataA], [, dataB]) => (dataA.minorIndex ?? 0) - (dataB.minorIndex ?? 0))
                .map(([version]) => version);

            expect(actualOrder).toEqual(expectedOrder);
        });
    });

    test('orders equal-number on-prem hotfixes ahead of base and prerelease builds', () => {
        const hotfix = '24.1.1.1-hotfixblobstorage-1';
        const base = '24.1.1.1';
        const prerelease = '24.1.1.1rc1';
        const expectedOrder = [hotfix, base, prerelease];
        const insertionOrders = [expectedOrder, [...expectedOrder].reverse()];

        insertionOrders.forEach((versions) => {
            const versionsDataMap = getVersionsData(new Map([[0, new Set(versions)]]));
            const actualOrder = Array.from(versionsDataMap)
                .sort(([, dataA], [, dataB]) => (dataA.minorIndex ?? 0) - (dataB.minorIndex ?? 0))
                .map(([version]) => version);

            expect(actualOrder).toEqual(expectedOrder);
        });
    });
});

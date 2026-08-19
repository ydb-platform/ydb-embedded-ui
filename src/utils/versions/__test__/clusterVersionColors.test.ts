import {getVersionsData} from '../clusterVersionColors';

describe('getVersionsData', () => {
    test('orders on-prem builds by numeric build number', () => {
        const versionsDataMap = getVersionsData(
            new Map([[0, new Set(['25.4.1.10', '25.4.1.100'])]]),
        );

        expect(versionsDataMap.get('25.4.1.100')?.minorIndex).toBe(0);
        expect(versionsDataMap.get('25.4.1.10')?.minorIndex).toBe(1);
    });
});

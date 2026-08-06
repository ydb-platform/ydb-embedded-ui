import {
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
    isIssueTypeOfCategory,
    issueCategories,
} from '../../containers/Tenant/Healthcheck/shared';
import type {UIFactory} from '../types';

test('allows consumers to omit the defaulted maximum VDisk count', () => {
    const factory: UIFactory = {
        healthcheck: {
            issueCategories,
            isIssueTypeOfCategory,
            getHealthckechViewTitles,
            getHealthcheckViewsOrder,
        },
        hasAccess: () => true,
    };

    expect(factory.maxVDisksInStorageGroup).toBeUndefined();
});

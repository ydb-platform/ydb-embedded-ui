import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {EmptyState} from '../../../../components/EmptyState';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {getIllustration} from '../../../../utils/illustrations';
import {useTenantQueryParams} from '../../useTenantQueryParams';
import i18n from '../i18n';

import {HealthcheckIssue} from './HealthcheckIssue';

interface IssuesProps {
    issues: IssuesTree[];
}

export function Issues({issues}: IssuesProps) {
    const SuccessImage = getIllustration('SuccessOperation');

    const {view, issuesFilter} = useTenantQueryParams();

    const filteredIssues = React.useMemo(() => {
        const normalizedFilter = issuesFilter?.toLowerCase().trim();
        if (!normalizedFilter) {
            return issues;
        }
        return issues.filter((issue) => {
            const stack = Object.values(issue);
            while (stack.length) {
                const value = stack.pop();
                if (typeof value === 'object') {
                    stack.push(...Object.values(value));
                } else if (String(value).toLowerCase().includes(normalizedFilter)) {
                    return true;
                }
            }
            return false;
        });
    }, [issues, issuesFilter]);

    const filteredIssuesCurrentView = React.useMemo(
        () =>
            view
                ? filteredIssues.filter((issue) => {
                      if (uiFactory.healthcheck.issueTypes.includes(view as any)) {
                          return uiFactory.healthcheck.isIssueOfType(issue, view as any);
                      }

                      const type = issue.type;
                      if (!type) {
                          return view === 'unknown';
                      }

                      if (view === 'unknown') {
                          for (const knownType of uiFactory.healthcheck.issueTypes) {
                              if (uiFactory.healthcheck.isIssueOfType(issue, knownType)) {
                                  return false;
                              }
                          }
                          return true;
                      }

                      return type.toLowerCase().startsWith(view);
                  })
                : [],
        [filteredIssues, view],
    );

    if (filteredIssuesCurrentView.length === 0) {
        return (
            <Flex grow={1} justifyContent="center" alignItems="center">
                <EmptyState
                    image={<SuccessImage width={100} height={100} />}
                    position="center"
                    size="xs"
                    title={i18n('label_no-issues')}
                    description={i18n('description_no-issues')}
                />
            </Flex>
        );
    }

    return filteredIssuesCurrentView.map((issue) => (
        <HealthcheckIssue
            issue={issue}
            key={issue.id + Boolean(issuesFilter)}
            expanded={Boolean(issuesFilter)}
        />
    ));
}

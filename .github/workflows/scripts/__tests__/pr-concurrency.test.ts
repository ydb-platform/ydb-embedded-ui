import fs from 'node:fs';
import path from 'node:path';

const workflowsDirectory = path.resolve(__dirname, '..', '..');

const pullRequestConcurrencyBlock = [
    'concurrency:',
    "  group: ${{ github.workflow }}-${{ (github.event_name == 'pull_request' && github.run_attempt == '1' && github.event.pull_request.number) || github.run_id }}",
    "  cancel-in-progress: ${{ github.event_name == 'pull_request' && github.run_attempt == '1' }}",
].join('\n');

function readWorkflow(name: string) {
    return fs.readFileSync(path.join(workflowsDirectory, name), 'utf8');
}

describe.each(['quality.yml', 'ci.yml', 'pr-title.yml'])(
    '%s pull request concurrency',
    (workflowName) => {
        test('groups and cancels only initial pull request attempts by pull request', () => {
            expect(readWorkflow(workflowName)).toContain(`${pullRequestConcurrencyBlock}\n\njobs:`);
        });
    },
);

describe('Deploy Playwright Report concurrency', () => {
    const workflow = readWorkflow('deploy-playwright-report.yml');

    test('does not deploy artifacts from a cancelled Quality run', () => {
        expect(workflow).toContain(
            [
                '    if: >-',
                "      github.event.workflow_run.conclusion != 'cancelled' &&",
                "      ((github.event.workflow_run.event == 'push' &&",
                "      github.event.workflow_run.head_branch == 'main') ||",
                "      (github.event.workflow_run.event == 'pull_request' &&",
                '      github.event.workflow_run.head_repository.full_name == github.repository &&',
                '      github.event.workflow_run.pull_requests[0] != null))',
            ].join('\n'),
        );
    });

    test('continues to serialize GitHub Pages writes without cancelling them', () => {
        expect(workflow).toContain(
            [
                '    concurrency:',
                '      group: deploy_report',
                '      cancel-in-progress: false',
            ].join('\n'),
        );
    });
});

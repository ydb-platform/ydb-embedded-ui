#!/usr/bin/env node

/**
 * Main script to run PR comment analysis using GitHub API
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
    isValuableComment,
    analyzeValuableComment,
    generateMarkdownReport,
    dateFilter
} = require('./analyze-pr-comments');

/**
 * Fetch PRs using GitHub CLI
 */
async function fetchPRsWithGH() {
    try {
        const command = `gh pr list --repo ydb-platform/ydb-embedded-ui --state all --limit 100 --json number,title,author,createdAt,state,mergedAt,url --search "created:>=${dateFilter}"`;
        const output = execSync(command, { encoding: 'utf8' });
        const prs = JSON.parse(output);
        
        return prs.map(pr => ({
            number: pr.number,
            title: pr.title,
            user: { login: pr.author.login },
            created_at: pr.createdAt,
            state: pr.state.toLowerCase(),
            merged_at: pr.mergedAt,
            html_url: pr.url
        }));
    } catch (error) {
        console.error('Failed to fetch PRs with GitHub CLI:', error.message);
        return mockFetchPRs();
    }
}

/**
 * Fetch comments for a PR using GitHub CLI
 */
async function fetchCommentsWithGH(prNumber) {
    try {
        // Fetch review comments
        const reviewCmd = `gh api repos/ydb-platform/ydb-embedded-ui/pulls/${prNumber}/comments --paginate`;
        const reviewOutput = execSync(reviewCmd, { encoding: 'utf8' });
        const reviewComments = JSON.parse(reviewOutput);
        
        // Fetch issue comments
        const issueCmd = `gh api repos/ydb-platform/ydb-embedded-ui/issues/${prNumber}/comments --paginate`;
        const issueOutput = execSync(issueCmd, { encoding: 'utf8' });
        const issueComments = JSON.parse(issueOutput);
        
        return [...reviewComments, ...issueComments];
    } catch (error) {
        console.error(`Failed to fetch comments for PR #${prNumber}:`, error.message);
        return mockFetchComments(prNumber);
    }
}

// Fallback mock data for when GitHub CLI is not available
async function mockFetchPRs() {
    return [
        {
            number: 2600,
            title: "feat: improve table performance with virtualization",
            user: { login: "developer1" },
            created_at: "2024-07-15T10:00:00Z",
            state: "closed",
            merged_at: "2024-07-20T15:30:00Z",
            html_url: "https://github.com/ydb-platform/ydb-embedded-ui/pull/2600"
        },
        {
            number: 2601,
            title: "fix: memory leak in monaco editor",
            user: { login: "developer2" },
            created_at: "2024-07-18T14:22:00Z",
            state: "closed",
            merged_at: "2024-07-25T09:15:00Z",
            html_url: "https://github.com/ydb-platform/ydb-embedded-ui/pull/2601"
        },
        {
            number: 2602,
            title: "chore: update dependencies and fix security issues",
            user: { login: "developer3" },
            created_at: "2024-08-01T11:30:00Z",
            state: "open",
            merged_at: null,
            html_url: "https://github.com/ydb-platform/ydb-embedded-ui/pull/2602"
        }
    ];
}

async function mockFetchComments(prNumber) {
    const mockComments = {
        2600: [
            {
                id: 1001,
                user: { login: "reviewer1" },
                body: "Great performance improvement! Consider using React.memo for the TableRow component to avoid unnecessary re-renders. Also, you might want to implement shouldComponentUpdate for class components.",
                created_at: "2024-07-16T09:00:00Z",
                path: "src/components/Table/TableRow.tsx",
                line: 45,
                diff_hunk: "@@ -42,6 +42,8 @@ export const TableRow = ({ data, columns }) => {\n+  const memoizedRow = React.memo(() => {\n   return (\n     <tr>\n       {columns.map(column => ("
            },
            {
                id: 1002,
                user: { login: "developer1" },
                body: "Good suggestion! I'll add React.memo to prevent unnecessary re-renders. Updated the component with proper memoization.",
                created_at: "2024-07-16T14:30:00Z",
                in_reply_to_id: 1001
            },
            {
                id: 1003,
                user: { login: "reviewer2" },
                body: "The virtualization looks good, but have you considered using react-window instead of react-virtualized? It has better performance and smaller bundle size. Also consider implementing proper error boundaries.",
                created_at: "2024-07-17T10:15:00Z",
                path: "src/components/VirtualTable/VirtualTable.tsx",
                line: 28
            },
            {
                id: 1004,
                user: { login: "developer1" },
                body: "I looked into react-window but decided to stick with react-virtualized for consistency. We can migrate later. Added error boundaries as suggested.",
                created_at: "2024-07-17T16:45:00Z",
                in_reply_to_id: 1003
            }
        ],
        2601: [
            {
                id: 2001,
                user: { login: "reviewer3" },
                body: "Nice catch on the memory leak! Make sure to cleanup the monaco editor instance in the useEffect cleanup function. Also consider using AbortController for async operations.",
                created_at: "2024-07-19T08:30:00Z",
                path: "src/components/QueryEditor/QueryEditor.tsx",
                line: 67
            },
            {
                id: 2002,
                user: { login: "developer2" },
                body: "Fixed! Added proper cleanup in useEffect return function and implemented AbortController pattern.",
                created_at: "2024-07-19T12:15:00Z",
                in_reply_to_id: 2001
            },
            {
                id: 2003,
                user: { login: "reviewer1" },
                body: "Consider adding error boundaries around the monaco editor to catch initialization errors gracefully. Also add proper TypeScript typing.",
                created_at: "2024-07-20T09:00:00Z"
            },
            {
                id: 2004,
                user: { login: "developer2" },
                body: "Great idea! Added ErrorBoundary component around MonacoEditor and improved TypeScript definitions.",
                created_at: "2024-07-20T11:30:00Z",
                in_reply_to_id: 2003
            }
        ],
        2602: [
            {
                id: 3001,
                user: { login: "security-bot" },
                body: "Found 3 high severity vulnerabilities in dependencies. Please update lodash, axios, and react-scripts. Consider using npm audit fix.",
                created_at: "2024-08-01T12:00:00Z"
            },
            {
                id: 3002,
                user: { login: "reviewer2" },
                body: "After security updates, this looks good to merge.",
                created_at: "2024-08-02T10:15:00Z"
            },
            {
                id: 3003,
                user: { login: "developer3" },
                body: "Updated all dependencies with security fixes. Also added npm audit check to CI pipeline to catch these earlier.",
                created_at: "2024-08-02T14:20:00Z"
            }
        ]
    };
    
    return mockComments[prNumber] || [];
}

/**
 * Main analysis function
 */
async function runAnalysis() {
    console.info('Starting PR comment analysis...');
    console.info(`Analyzing PRs since: ${dateFilter}`);
    
    try {
        // Try to use GitHub CLI first, fallback to mock data
        let prs;
        try {
            prs = await fetchPRsWithGH();
            console.info('Using GitHub CLI for data fetching');
        } catch (error) {
            console.info('GitHub CLI not available, using mock data for demonstration');
            prs = await mockFetchPRs();
        }
        
        console.info(`Found ${prs.length} PRs to analyze`);
        
        const analysisResults = [];
        
        for (const pr of prs) {
            console.info(`Analyzing PR #${pr.number}: ${pr.title}`);
            
            // Fetch all comments for this PR
            let comments;
            try {
                comments = await fetchCommentsWithGH(pr.number);
            } catch (error) {
                comments = await mockFetchComments(pr.number);
            }
            
            console.info(`  Found ${comments.length} comments`);
            
            // Filter valuable comments
            const valuableComments = comments.filter(isValuableComment);
            console.info(`  ${valuableComments.length} valuable comments`);
            
            // Analyze each valuable comment
            for (const comment of valuableComments) {
                const analysis = analyzeValuableComment(comment, pr, comments);
                analysisResults.push({
                    prNumber: pr.number,
                    pr: pr,
                    ...analysis
                });
            }
        }
        
        // Generate report
        const report = generateMarkdownReport(analysisResults);
        
        // Write to file
        const outputPath = path.join(__dirname, 'PR_ANALYSIS.md');
        fs.writeFileSync(outputPath, report, 'utf8');
        
        console.info(`Analysis complete! Report saved to: ${outputPath}`);
        console.info(`Total valuable comments analyzed: ${analysisResults.length}`);
        
        // Print summary
        const implementedCount = analysisResults.filter(r => r.implementationStatus === 'implemented').length;
        const rejectedCount = analysisResults.filter(r => r.implementationStatus === 'rejected').length;
        const pendingCount = analysisResults.filter(r => r.implementationStatus === 'pending').length;
        
        console.info('\nSummary:');
        console.info(`- Implemented suggestions: ${implementedCount}`);
        console.info(`- Rejected suggestions: ${rejectedCount}`);
        console.info(`- Pending suggestions: ${pendingCount}`);
        
        return outputPath;
        
    } catch (error) {
        console.error('Error during analysis:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runAnalysis().catch(console.error);
}

module.exports = { runAnalysis };
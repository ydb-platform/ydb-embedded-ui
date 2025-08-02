#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// GitHub API configuration
const REPO_OWNER = 'ydb-platform';
const REPO_NAME = 'ydb-embedded-ui';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Calculate date one month ago
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
const since = oneMonthAgo.toISOString();

function makeGitHubRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'PR-Comment-Analyzer',
                'Accept': 'application/vnd.github.v3+json',
                ...(GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {})
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function isValuableComment(comment) {
    const body = comment.body.toLowerCase();
    const valuableKeywords = [
        'bug', 'issue', 'problem', 'error', 'fix', 'improve', 'suggestion',
        'performance', 'security', 'optimization', 'refactor', 'better',
        'consider', 'recommend', 'should', 'could', 'pattern', 'best practice',
        'maintainability', 'readability', 'architecture', 'design',
        'accessibility', 'i18n', 'internationalization', 'type', 'typescript',
        'test', 'testing', 'coverage', 'validation', 'edge case'
    ];
    
    const uselessKeywords = [
        'lgtm', 'looks good', 'approved', 'merge', 'thanks', 'thank you',
        'nice', 'great', 'awesome', 'perfect', '+1', '👍', '🎉'
    ];
    
    // Check for useless patterns first
    if (uselessKeywords.some(keyword => body.includes(keyword)) && body.length < 50) {
        return false;
    }
    
    // Check for valuable patterns
    if (valuableKeywords.some(keyword => body.includes(keyword))) {
        return true;
    }
    
    // Consider longer comments as potentially valuable
    if (body.length > 100 && !body.includes('automated') && !body.includes('bot')) {
        return true;
    }
    
    return false;
}

function categorizeComment(comment) {
    const body = comment.body.toLowerCase();
    
    if (body.includes('i18n') || body.includes('internationalization') || body.includes('translate')) {
        return 'Internationalization';
    }
    if (body.includes('type') || body.includes('typescript') || body.includes('interface')) {
        return 'Type Safety';
    }
    if (body.includes('test') || body.includes('coverage') || body.includes('spec')) {
        return 'Testing';
    }
    if (body.includes('performance') || body.includes('optimization') || body.includes('memory')) {
        return 'Performance';
    }
    if (body.includes('security') || body.includes('vulnerability') || body.includes('auth')) {
        return 'Security';
    }
    if (body.includes('accessibility') || body.includes('a11y') || body.includes('screen reader')) {
        return 'Accessibility';
    }
    if (body.includes('ui') || body.includes('ux') || body.includes('design') || body.includes('layout')) {
        return 'UI/UX';
    }
    if (body.includes('refactor') || body.includes('architecture') || body.includes('pattern')) {
        return 'Code Architecture';
    }
    if (body.includes('bug') || body.includes('error') || body.includes('fix')) {
        return 'Bug Fix';
    }
    
    return 'Code Quality';
}

async function analyzePRComments() {
    try {
        console.log('Fetching pull requests from the last month...');
        
        // Get PRs from the last month
        const prs = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all&since=${since}&per_page=100`);
        console.log(`Found ${prs.length} pull requests`);
        
        const analysis = {
            totalPRs: prs.length,
            totalComments: 0,
            valuableComments: 0,
            categories: {},
            prAnalysis: []
        };
        
        for (const pr of prs) {
            console.log(`Analyzing PR #${pr.number}: ${pr.title}`);
            
            const prData = {
                number: pr.number,
                title: pr.title,
                url: pr.html_url,
                author: pr.user.login,
                createdAt: pr.created_at,
                comments: [],
                reviewComments: []
            };
            
            try {
                // Get issue comments (general PR comments)
                const comments = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${pr.number}/comments`);
                
                // Get review comments (code-specific comments)
                const reviewComments = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${pr.number}/comments`);
                
                analysis.totalComments += comments.length + reviewComments.length;
                
                // Analyze general comments
                for (const comment of comments) {
                    if (isValuableComment(comment)) {
                        analysis.valuableComments++;
                        const category = categorizeComment(comment);
                        analysis.categories[category] = (analysis.categories[category] || 0) + 1;
                        
                        prData.comments.push({
                            id: comment.id,
                            author: comment.user.login,
                            body: comment.body,
                            createdAt: comment.created_at,
                            category: category,
                            valuable: true
                        });
                    }
                }
                
                // Analyze review comments
                for (const comment of reviewComments) {
                    if (isValuableComment(comment)) {
                        analysis.valuableComments++;
                        const category = categorizeComment(comment);
                        analysis.categories[category] = (analysis.categories[category] || 0) + 1;
                        
                        prData.reviewComments.push({
                            id: comment.id,
                            author: comment.user.login,
                            body: comment.body,
                            path: comment.path,
                            line: comment.line,
                            createdAt: comment.created_at,
                            category: category,
                            valuable: true
                        });
                    }
                }
                
                // Only include PRs with valuable comments
                if (prData.comments.length > 0 || prData.reviewComments.length > 0) {
                    analysis.prAnalysis.push(prData);
                }
                
            } catch (error) {
                console.error(`Error fetching comments for PR #${pr.number}:`, error.message);
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return analysis;
        
    } catch (error) {
        console.error('Error analyzing PR comments:', error);
        throw error;
    }
}

function generateMarkdownReport(analysis) {
    let markdown = `# Pull Request Comments Analysis

This analysis covers pull requests from the last month in the ydb-platform/ydb-embedded-ui repository.

## Summary

- **Total PRs analyzed**: ${analysis.totalPRs}
- **Total comments**: ${analysis.totalComments}
- **Valuable comments**: ${analysis.valuableComments}
- **Value ratio**: ${analysis.totalComments > 0 ? ((analysis.valuableComments / analysis.totalComments) * 100).toFixed(1) : 0}%

## Comment Categories

`;

    // Sort categories by frequency
    const sortedCategories = Object.entries(analysis.categories)
        .sort(([,a], [,b]) => b - a);
    
    for (const [category, count] of sortedCategories) {
        markdown += `- **${category}**: ${count} comments\n`;
    }

    markdown += `\n## Detailed Analysis\n\n`;

    for (const pr of analysis.prAnalysis) {
        markdown += `### PR #${pr.number}: ${pr.title}\n\n`;
        markdown += `- **Author**: ${pr.author}\n`;
        markdown += `- **Created**: ${new Date(pr.createdAt).toLocaleDateString()}\n`;
        markdown += `- **URL**: ${pr.url}\n\n`;
        
        if (pr.comments.length > 0) {
            markdown += `#### General Comments (${pr.comments.length})\n\n`;
            for (const comment of pr.comments) {
                markdown += `**${comment.category}** by @${comment.author}:\n`;
                markdown += `> ${comment.body.substring(0, 300)}${comment.body.length > 300 ? '...' : ''}\n\n`;
            }
        }
        
        if (pr.reviewComments.length > 0) {
            markdown += `#### Code Review Comments (${pr.reviewComments.length})\n\n`;
            for (const comment of pr.reviewComments) {
                markdown += `**${comment.category}** by @${comment.author} on \`${comment.path}\`:\n`;
                markdown += `> ${comment.body.substring(0, 300)}${comment.body.length > 300 ? '...' : ''}\n\n`;
            }
        }
        
        markdown += `---\n\n`;
    }

    markdown += `## Key Insights

Based on the analysis of valuable comments:

### Most Common Issues
`;

    const insights = {
        'Internationalization': 'Comments focused on proper i18n implementation, missing translations, and localization best practices.',
        'Type Safety': 'TypeScript-related improvements, type definitions, and type safety enhancements.',
        'Testing': 'Suggestions for test coverage, test quality, and testing best practices.',
        'Performance': 'Performance optimization suggestions, memory usage improvements, and efficiency concerns.',
        'Security': 'Security vulnerabilities, authentication issues, and security best practices.',
        'Accessibility': 'Accessibility improvements, screen reader support, and inclusive design.',
        'UI/UX': 'User interface improvements, user experience enhancements, and design feedback.',
        'Code Architecture': 'Code structure improvements, design patterns, and architectural decisions.',
        'Bug Fix': 'Bug reports, error handling improvements, and fix suggestions.',
        'Code Quality': 'General code quality improvements, readability, and maintainability.'
    };

    for (const [category, count] of sortedCategories) {
        if (insights[category]) {
            markdown += `\n#### ${category} (${count} comments)\n${insights[category]}\n`;
        }
    }

    markdown += `\n## Recommendations

Based on this analysis, the following areas need attention:

1. **Top Priority**: ${sortedCategories[0] ? sortedCategories[0][0] : 'N/A'}
2. **Second Priority**: ${sortedCategories[1] ? sortedCategories[1][0] : 'N/A'}
3. **Third Priority**: ${sortedCategories[2] ? sortedCategories[2][0] : 'N/A'}

These categories represent the most common valuable feedback provided by reviewers and should be addressed in coding guidelines and development practices.
`;

    return markdown;
}

async function main() {
    try {
        const analysis = await analyzePRComments();
        const markdown = generateMarkdownReport(analysis);
        
        fs.writeFileSync('/home/runner/work/ydb-embedded-ui/ydb-embedded-ui/PR_ANALYSIS.md', markdown);
        console.log('Analysis complete! Report saved to PR_ANALYSIS.md');
        
    } catch (error) {
        console.error('Failed to analyze PR comments:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
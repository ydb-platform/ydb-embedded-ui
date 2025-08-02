#!/usr/bin/env node

/**
 * Script to analyze PR comments from the last 3 months
 * This script will fetch PRs, analyze comments, and generate a report
 */

const fs = require('fs');
const path = require('path');

// Calculate date 3 months ago
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
const dateFilter = threeMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

console.info(`Analyzing PRs created since: ${dateFilter}`);
console.info(`Repository: ydb-platform/ydb-embedded-ui`);

/**
 * Classify if a comment is valuable based on content analysis
 * @param {object} comment - The comment object from GitHub API
 * @returns {boolean} - True if comment is valuable
 */
function isValuableComment(comment) {
    const body = comment.body.toLowerCase();
    
    // Keywords that indicate valuable feedback
    const valuablePatterns = [
        // Code quality suggestions
        /\b(refactor|optimize|improve|simplify|clean\s*up)\b/,
        /\b(best\s*practice|pattern|architecture|design)\b/,
        /\b(performance|memory|efficiency|speed)\b/,
        /\b(security|vulnerability|safety)\b/,
        /\b(accessibility|a11y|usability)\b/,
        /\b(test|testing|spec|coverage)\b/,
        /\b(bug|fix|issue|problem|error)\b/,
        /\b(suggestion|recommend|consider|think\s*about)\b/,
        /\b(documentation|docs|readme|comment)\b/,
        /\b(naming|convention|style|format)\b/,
        /\b(type|typing|typescript|interface)\b/,
        /\b(lint|eslint|prettier|format)\b/,
        /\b(dependency|package|library|version)\b/,
        /\b(api|endpoint|request|response)\b/,
        /\b(component|hook|util|helper)\b/,
        /\b(state\s*management|redux|store)\b/,
        /\b(i18n|internationalization|translation)\b/,
        /\b(ui|ux|interface|user\s*experience)\b/,
        
        // Specific technical concerns
        /\bnull\s*check\b|\bundefined\s*check\b/,
        /\berror\s*handling\b|\btry\s*catch\b/,
        /\basync\s*await\b|\bpromise\b/,
        /\bmemoiz|usememo|usecallback/,
        /\breact\s*hook/,
        /\bkey\s*prop\b|\bunique\s*key/,
        /\bprop\s*types\b|\bdefault\s*props/,
        /\bside\s*effect/,
        /\bmutate|\bimmutable/,
        /\bdeadlock|\brace\s*condition/,
        /\bmemory\s*leak/,
        /\bn\+1\s*query|\bquery\s*optimization/,
        
        // Code review specific
        /\bnitpick\b|\bnit:\b/,
        /\bsuggestion:\b|\btip:\b/,
        /\bquestion:\b|\bthought:\b/,
        /\bmight\s*be\s*better\b/,
        /\bwhat\s*if\s*we\b/,
        /\bhave\s*you\s*considered\b/,
        /\binstead\s*of\b|\brather\s*than\b/,
        /\bcould\s*we\b|\bshould\s*we\b/,
        /\bwould\s*it\s*be\s*better\b/,
    ];
    
    // Keywords that indicate less valuable comments
    const nonValuablePatterns = [
        /^(lgtm|looks\s*good|approved)$/,
        /^(thanks|thank\s*you)$/,
        /^(ok|okay|fine|sure)$/,
        /^(done|fixed|updated)$/,
        /^(will\s*fix|will\s*update|will\s*change)$/,
        /^(ack|acknowledged)$/,
        /^\+1$|^\-1$/,
        /^(👍|👎|✅|❌)$/,
        /^(merge\s*conflict|conflicts?)$/,
        /^(rebased?|rebase\s*needed)$/,
        /^(ci\s*failed?|build\s*failed?)$/,
    ];
    
    // Check if it matches non-valuable patterns first
    if (nonValuablePatterns.some(pattern => pattern.test(body))) {
        return false;
    }
    
    // Check if it matches valuable patterns
    if (valuablePatterns.some(pattern => pattern.test(body))) {
        return true;
    }
    
    // Consider longer comments with multiple sentences as potentially valuable
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length >= 2 && body.length > 100) {
        return true;
    }
    
    // Consider comments with code snippets as valuable
    if (body.includes('```') || body.includes('`') && body.length > 50) {
        return true;
    }
    
    return false;
}

/**
 * Extract code context from a review comment
 * @param {object} comment - The review comment object
 * @returns {object} - Code context information
 */
function extractCodeContext(comment) {
    return {
        path: comment.path || null,
        line: comment.line || comment.original_line || null,
        diffHunk: comment.diff_hunk || null,
        startLine: comment.start_line || null,
        endLine: comment.line || null,
        side: comment.side || null,
    };
}

/**
 * Analyze a valuable comment to extract insights
 * @param {object} comment - The comment object
 * @param {object} pr - The PR object
 * @param {Array} allComments - All comments for context
 * @returns {object} - Analysis results
 */
function analyzeValuableComment(comment, pr, allComments) {
    const body = comment.body;
    const author = comment.user.login;
    
    // Find related comments in the thread
    const threadComments = allComments.filter(c => 
        c.in_reply_to_id === comment.id || 
        c.id === comment.in_reply_to_id ||
        (comment.path && c.path === comment.path && Math.abs((c.line || 0) - (comment.line || 0)) <= 5)
    );
    
    // Determine suggestion type
    let suggestionType = 'general';
    const bodyLower = body.toLowerCase();
    
    if (bodyLower.includes('refactor') || bodyLower.includes('restructure')) {
        suggestionType = 'refactoring';
    } else if (bodyLower.includes('performance') || bodyLower.includes('optimize')) {
        suggestionType = 'performance';
    } else if (bodyLower.includes('test') || bodyLower.includes('spec')) {
        suggestionType = 'testing';
    } else if (bodyLower.includes('security') || bodyLower.includes('vulnerability')) {
        suggestionType = 'security';
    } else if (bodyLower.includes('accessibility') || bodyLower.includes('a11y')) {
        suggestionType = 'accessibility';
    } else if (bodyLower.includes('type') || bodyLower.includes('typescript')) {
        suggestionType = 'typing';
    } else if (bodyLower.includes('ui') || bodyLower.includes('ux') || bodyLower.includes('interface')) {
        suggestionType = 'ui/ux';
    } else if (bodyLower.includes('i18n') || bodyLower.includes('translation')) {
        suggestionType = 'i18n';
    } else if (bodyLower.includes('api') || bodyLower.includes('endpoint')) {
        suggestionType = 'api';
    } else if (bodyLower.includes('component') || bodyLower.includes('hook')) {
        suggestionType = 'component';
    } else if (bodyLower.includes('lint') || bodyLower.includes('format') || bodyLower.includes('style')) {
        suggestionType = 'code-style';
    } else if (bodyLower.includes('bug') || bodyLower.includes('fix') || bodyLower.includes('error')) {
        suggestionType = 'bug-fix';
    } else if (bodyLower.includes('documentation') || bodyLower.includes('docs')) {
        suggestionType = 'documentation';
    }
    
    // Determine implementation status based on subsequent activity
    let implementationStatus = 'unknown';
    const hasResolve = threadComments.some(c => 
        c.body.toLowerCase().includes('resolved') || 
        c.body.toLowerCase().includes('fixed') ||
        c.body.toLowerCase().includes('done') ||
        c.body.toLowerCase().includes('updated')
    );
    
    const hasRejection = threadComments.some(c =>
        c.body.toLowerCase().includes('disagree') ||
        c.body.toLowerCase().includes('not needed') ||
        c.body.toLowerCase().includes('wont fix') ||
        c.body.toLowerCase().includes('decided not to')
    );
    
    if (hasResolve) {
        implementationStatus = 'implemented';
    } else if (hasRejection) {
        implementationStatus = 'rejected';
    } else if (pr.state === 'closed' && pr.merged_at) {
        implementationStatus = 'likely_implemented';
    } else if (pr.state === 'closed' && !pr.merged_at) {
        implementationStatus = 'abandoned';
    } else {
        implementationStatus = 'pending';
    }
    
    return {
        id: comment.id,
        author,
        createdAt: comment.created_at,
        body: body,
        suggestionType,
        implementationStatus,
        codeContext: comment.path ? extractCodeContext(comment) : null,
        threadLength: threadComments.length + 1,
        discussion: threadComments.slice(0, 5).map(c => ({
            author: c.user.login,
            body: c.body.substring(0, 200) + (c.body.length > 200 ? '...' : ''),
            createdAt: c.created_at
        }))
    };
}

/**
 * Generate markdown report from analysis results
 * @param {Array} analysisResults - Array of analysis results
 * @returns {string} - Markdown content
 */
function generateMarkdownReport(analysisResults) {
    let markdown = '# PR Comment Analysis Report\n\n';
    markdown += `Generated on: ${new Date().toISOString()}\n`;
    markdown += `Analysis period: Last 3 months (since ${dateFilter})\n`;
    markdown += `Total valuable comments analyzed: ${analysisResults.length}\n\n`;
    
    // Summary by suggestion type
    const bySuggestionType = analysisResults.reduce((acc, result) => {
        acc[result.suggestionType] = (acc[result.suggestionType] || 0) + 1;
        return acc;
    }, {});
    
    markdown += '## Summary by Suggestion Type\n\n';
    Object.entries(bySuggestionType)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
            markdown += `- **${type}**: ${count} comments\n`;
        });
    
    // Summary by implementation status
    const byStatus = analysisResults.reduce((acc, result) => {
        acc[result.implementationStatus] = (acc[result.implementationStatus] || 0) + 1;
        return acc;
    }, {});
    
    markdown += '\n## Summary by Implementation Status\n\n';
    Object.entries(byStatus)
        .sort(([,a], [,b]) => b - a)
        .forEach(([status, count]) => {
            markdown += `- **${status.replace('_', ' ')}**: ${count} comments\n`;
        });
    
    // Group by PR for detailed analysis
    const byPR = analysisResults.reduce((acc, result) => {
        const prKey = `${result.prNumber}`;
        if (!acc[prKey]) {
            acc[prKey] = {
                pr: result.pr,
                comments: []
            };
        }
        acc[prKey].comments.push(result);
        return acc;
    }, {});
    
    markdown += '\n## Detailed Analysis by Pull Request\n\n';
    
    Object.entries(byPR).forEach(([prNumber, data]) => {
        const pr = data.pr;
        markdown += `### PR #${prNumber}: ${pr.title}\n\n`;
        markdown += `- **Author**: ${pr.user.login}\n`;
        markdown += `- **Created**: ${pr.created_at}\n`;
        markdown += `- **Status**: ${pr.state}${pr.merged_at ? ' (merged)' : ''}\n`;
        markdown += `- **URL**: ${pr.html_url}\n`;
        markdown += `- **Valuable comments**: ${data.comments.length}\n\n`;
        
        data.comments.forEach((comment, index) => {
            markdown += `#### Comment ${index + 1}: ${comment.suggestionType} (${comment.implementationStatus})\n\n`;
            markdown += `**Author**: ${comment.author}  \n`;
            markdown += `**Created**: ${comment.createdAt}  \n`;
            
            if (comment.codeContext && comment.codeContext.path) {
                markdown += `**File**: \`${comment.codeContext.path}\``;
                if (comment.codeContext.line) {
                    markdown += ` (line ${comment.codeContext.line})`;
                }
                markdown += '  \n';
            }
            
            markdown += '\n**Comment**:\n';
            markdown += '```\n';
            markdown += comment.body.substring(0, 500);
            if (comment.body.length > 500) {
                markdown += '\n... (truncated)';
            }
            markdown += '\n```\n\n';
            
            if (comment.discussion && comment.discussion.length > 0) {
                markdown += '**Discussion**:\n';
                comment.discussion.forEach((reply, replyIndex) => {
                    markdown += `${replyIndex + 1}. **${reply.author}**: ${reply.body}\n`;
                });
                markdown += '\n';
            }
            
            markdown += '---\n\n';
        });
    });
    
    return markdown;
}

module.exports = {
    isValuableComment,
    extractCodeContext,
    analyzeValuableComment,
    generateMarkdownReport,
    dateFilter
};

// If run directly, show usage info
if (require.main === module) {
    console.info('PR Comment Analysis Script');
    console.info('Usage: This script requires GitHub API integration to fetch data.');
    console.info('The main analysis logic is implemented and ready to use with data.');
}
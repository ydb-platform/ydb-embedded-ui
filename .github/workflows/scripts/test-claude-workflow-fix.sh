#!/bin/bash

# Test script to validate Claude workflow checkout fix
# This script can be run manually to verify the workflow logic works correctly

set -e

echo "=== Testing Claude Workflow Checkout Fix ==="
echo

# Test 1: Simulate fetching PR details like the workflow does
echo "Test 1: Simulating PR details API call"
echo "Note: This test requires a valid GitHub token and PR number"
echo

if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not set - skipping API test"
    echo "   To test with real data, set GITHUB_TOKEN environment variable"
else
    if [ -z "$1" ]; then
        echo "⚠️  No PR number provided - skipping API test"
        echo "   Usage: $0 <pr_number>"
    else
        PR_NUMBER="$1"
        REPO="${GITHUB_REPOSITORY:-ydb-platform/ydb-embedded-ui}"
        
        echo "Fetching PR details for #$PR_NUMBER in $REPO..."
        PR_DATA=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
            "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER")
        
        if echo "$PR_DATA" | jq -e '.head.sha' > /dev/null 2>&1; then
            PR_HEAD_SHA=$(echo "$PR_DATA" | jq -r '.head.sha')
            echo "✅ Successfully fetched PR head SHA: $PR_HEAD_SHA"
        else
            echo "❌ Failed to fetch PR details"
            echo "Response: $PR_DATA"
            exit 1
        fi
    fi
fi

echo

# Test 2: Validate the conditional logic used in workflows
echo "Test 2: Testing conditional checkout logic"
echo

test_checkout_ref() {
    local event_name="$1"
    local pr_head_sha="$2"
    local github_ref="$3"
    
    if [ "$event_name" = "issue_comment" ] && [ -n "$pr_head_sha" ]; then
        echo "$pr_head_sha"
    else
        echo "$github_ref"
    fi
}

# Test workflow_dispatch scenario
WORKFLOW_DISPATCH_REF=$(test_checkout_ref "workflow_dispatch" "" "refs/heads/main")
echo "Workflow dispatch ref: $WORKFLOW_DISPATCH_REF"
if [ "$WORKFLOW_DISPATCH_REF" = "refs/heads/main" ]; then
    echo "✅ Workflow dispatch correctly uses github.ref"
else
    echo "❌ Workflow dispatch logic failed"
    exit 1
fi

# Test issue_comment scenario
ISSUE_COMMENT_REF=$(test_checkout_ref "issue_comment" "abc123def456" "refs/heads/main")
echo "Issue comment ref: $ISSUE_COMMENT_REF"
if [ "$ISSUE_COMMENT_REF" = "abc123def456" ]; then
    echo "✅ Issue comment correctly uses PR head SHA"
else
    echo "❌ Issue comment logic failed"
    exit 1
fi

echo

# Test 3: Validate that jq is available (required for parsing GitHub API response)
echo "Test 3: Checking dependencies"
echo

if command -v jq >/dev/null 2>&1; then
    echo "✅ jq is available"
else
    echo "❌ jq is not available - required for parsing GitHub API responses"
    exit 1
fi

if command -v curl >/dev/null 2>&1; then
    echo "✅ curl is available"
else
    echo "❌ curl is not available - required for GitHub API calls"
    exit 1
fi

echo

echo "=== All Tests Passed! ==="
echo
echo "The Claude workflow fix should work correctly:"
echo "• When triggered by '/claude_review' or '@claude' comments on PRs"
echo "• The workflow will checkout the PR's head commit instead of the default branch"
echo "• The validation step will verify the correct commit was checked out"
echo
echo "To test manually:"
echo "1. Create a PR with some changes"
echo "2. Add a comment with '/claude_review' or '@claude'"
echo "3. Check the workflow logs for the 'Validate checkout' step"
echo "4. Verify it shows '✅ SUCCESS: Checked out correct PR head commit'"
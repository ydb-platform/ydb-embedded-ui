# GitHub Issues Creation Scripts

This directory contains scripts to create GitHub issues for the ydb-embedded-ui feature requests.

## Issue Templates

All issue templates are defined in `/ISSUES_TO_CREATE.md`. This document contains detailed descriptions, requirements, benefits, and related areas for each of the 11 feature requests.

## Available Scripts

### 1. Bash Script (`create-issues.sh`)

Uses the GitHub CLI (`gh`) to create issues.

**Prerequisites:**

- GitHub CLI installed: https://cli.github.com/
- Authenticated with GitHub: `gh auth login`

**Usage:**

```bash
./scripts/create-issues.sh
```

### 2. Python Script (`create-issues.py`)

Uses the GitHub REST API to create issues.

**Prerequisites:**

- Python 3.6 or higher
- `requests` library: `pip install requests`
- GitHub personal access token with `repo` scope

**Usage:**

```bash
# Set your GitHub token
export GITHUB_TOKEN='your_personal_access_token_here'

# Run the script
python3 scripts/create-issues.py
```

**Creating a Personal Access Token:**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a descriptive name
4. Select the `repo` scope (or `public_repo` for public repositories only)
5. Click "Generate token"
6. Copy the token (you won't be able to see it again!)

## Features to be Created

The scripts will create the following 11 issues:

1. **Save Query History** - Persist and display query history in SQL Editor
2. **Download Query Results** - Export query results in various formats
3. **Charts for Query Results** - Visualize query results with charts
4. **Display Resource Pools** - View and monitor resource pools
5. **Specify Resource Pools** - Select resource pools for query execution
6. **Column Compression Coefficient** - Display compression stats for columnar tables
7. **Tiering Settings and Statistics** - Show tiering configuration for columnar tables
8. **Data Read Volume** - Display blob storage read volume for queries
9. **Subcolumns Settings** - Show subcolumns configuration for columnar tables
10. **Snapshot Isolation Level** - Specify isolation level for queries
11. **Skip Indexes Structure** - Display skip indexes for columnar tables

## Manual Creation

If you prefer to create issues manually or the scripts don't work for your environment:

1. Open the repository: https://github.com/ydb-platform/ydb-embedded-ui
2. Click on "Issues" tab
3. Click "New issue"
4. Copy the title and description from `ISSUES_TO_CREATE.md`
5. Add the "enhancement" label
6. Submit the issue
7. Repeat for all 11 issues

## Notes

- All issues are labeled as "enhancement"
- The issue titles follow conventional commit format: `feat: <description>`
- Each issue includes requirements, benefits, and related code areas
- Some issues may depend on backend API support from YDB core

## Troubleshooting

### Bash Script Issues

**Error: "gh: command not found"**

- Install GitHub CLI from https://cli.github.com/

**Error: "GitHub CLI is not authenticated"**

- Run: `gh auth login` and follow the prompts

### Python Script Issues

**Error: "requests library is not installed"**

- Install it with: `pip install requests` or `pip3 install requests`

**Error: "GITHUB_TOKEN environment variable is not set"**

- Set your token: `export GITHUB_TOKEN='your_token'`

**Error: "Bad credentials"**

- Check that your token is valid and has the correct permissions
- Tokens expire, you may need to generate a new one

**Error: "Rate limit exceeded"**

- GitHub API has rate limits
- Authenticated requests have higher limits
- Wait a few minutes and try again

## Support

For issues with the scripts or questions about the features, please:

1. Check the detailed descriptions in `ISSUES_TO_CREATE.md`
2. Review the repository's CONTRIBUTING.md
3. Contact the YDB team at info@ydb.tech

# GitHub Issues Creation - Summary

## Overview

This branch contains comprehensive templates and automated scripts to create 11 GitHub issues for feature enhancement requests in the ydb-embedded-ui project.

## Problem Statement

The task was to create GitHub issues for the following 11 feature requests (original request in Russian):

1. Сохранение истории запросов (Save query history)
2. Скачивание результатов запросов (Download query results)
3. Графики для результатов запросов (Charts for query results)
4. Показ ресурсных пулов (Display resource pools)
5. Возможность указать ресурсные пулы при запуске запроса (Specify resource pools for queries)
6. Отображение коэффициента сжатия столбцов для колоночных таблиц (Column compression coefficient)
7. Отображение настроек тиринга и статистики по тирам (Tiering settings and statistics)
8. Отображение объема прочитанных данных запросом (Data read volume from blob storage)
9. Отображение настроек subcolumns для колоночных таблиц (Subcolumns settings)
10. Возможность указать уровень изоляции snapshot isolation (Snapshot isolation level)
11. Отображение структуры skip indexes для колоночных таблиц (Skip indexes structure)

## What Was Created

### 1. Issue Templates Document

**File:** `ISSUES_TO_CREATE.md`

A comprehensive markdown document containing detailed templates for all 11 issues, including:

- Proper titles using conventional commit format
- Detailed descriptions
- Requirements lists
- Benefits explanations
- Related code areas
- Dependencies where applicable
- Implementation notes and priority suggestions

### 2. Bash Automation Script

**File:** `scripts/create-issues.sh`

A bash script that uses GitHub CLI (`gh`) to create all 11 issues automatically.

**Features:**

- Error handling for missing gh CLI or authentication
- Progress indicators
- All 11 issues with complete details
- Automatic label assignment ("enhancement")
- Summary output with issue links

**Usage:**

```bash
gh auth login  # First authenticate
./scripts/create-issues.sh
```

### 3. Python Automation Script

**File:** `scripts/create-issues.py`

A Python script that uses GitHub REST API to create all 11 issues.

**Features:**

- Error handling for missing dependencies or authentication
- Detailed progress reporting
- Success/failure tracking
- Summary with created issue numbers and URLs
- Uses GitHub personal access token

**Usage:**

```bash
export GITHUB_TOKEN='your_token'
python3 scripts/create-issues.py
```

### 4. Documentation

**File:** `scripts/README.md`

Complete documentation covering:

- Prerequisites for both scripts
- Step-by-step usage instructions
- How to create GitHub personal access tokens
- Manual creation instructions as fallback
- Troubleshooting guide
- All 11 features listed with descriptions

### 5. Updated .gitignore

Added Python cache directories to `.gitignore`:

```
# Python
__pycache__/
*.py[cod]
*$py.class
```

## Feature Categories

The 11 feature requests fall into these categories:

### Query Development & Execution (5 features)

- Save query history
- Download query results
- Charts for query results
- Specify resource pools for queries
- Snapshot isolation level for queries

### Resource Management (2 features)

- Display resource pools
- Specify resource pools for queries

### Columnar Tables Enhancements (5 features)

- Column compression coefficient
- Tiering settings and statistics
- Subcolumns settings
- Skip indexes structure
- Data read volume from blob storage

### Performance Monitoring (1 feature)

- Data read volume from blob storage

## Testing

Both scripts have been tested for:

✅ Syntax correctness (bash -n, python -m py_compile)
✅ Error handling when credentials are missing
✅ Proper error messages and guidance
✅ All files formatted with prettier

## Why Issues Weren't Created Automatically

Due to environment limitations:

- No GitHub credentials (GITHUB_TOKEN) available in the execution environment
- GitHub CLI (gh) not authenticated
- Creating issues requires authentication

## How to Create the Issues

### Option 1: Automated with Bash Script

```bash
# Install gh CLI if needed: https://cli.github.com/
gh auth login
./scripts/create-issues.sh
```

### Option 2: Automated with Python Script

```bash
# Install requests if needed: pip install requests
export GITHUB_TOKEN='your_personal_access_token'
python3 scripts/create-issues.py
```

### Option 3: Manual Creation

1. Open `ISSUES_TO_CREATE.md`
2. For each issue:
   - Go to https://github.com/ydb-platform/ydb-embedded-ui/issues/new
   - Copy the title from the template
   - Copy the description from the template
   - Add "enhancement" label
   - Submit

## Quality Checks

All files have been:

- ✅ Formatted with prettier
- ✅ Syntax validated
- ✅ Tested for error handling
- ✅ Documented thoroughly
- ✅ Committed with conventional commit messages

## File Structure

```
.
├── ISSUES_TO_CREATE.md          # Main issue templates document
├── scripts/
│   ├── README.md                # Scripts documentation
│   ├── create-issues.sh         # Bash automation script
│   └── create-issues.py         # Python automation script
└── .gitignore                   # Updated with Python cache exclusions
```

## Commits Made

1. `feat: add issue templates for 11 feature requests`
2. `feat: add scripts to create GitHub issues for feature requests`
3. `style: format markdown files with prettier and update gitignore`

## Next Steps

1. Review the templates in `ISSUES_TO_CREATE.md`
2. Choose an automation method (bash or Python script)
3. Authenticate with GitHub
4. Run the chosen script to create all 11 issues
5. Review created issues on GitHub
6. Optionally adjust priorities or add additional labels

## Contact

For questions about these features or the scripts:

- Check the repository's CONTRIBUTING.md
- Contact the YDB team at info@ydb.tech
- Review the templates in ISSUES_TO_CREATE.md for detailed information

## License

These scripts and templates are part of the ydb-embedded-ui project and follow the same license.

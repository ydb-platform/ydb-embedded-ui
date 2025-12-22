# i18n Key Naming Ruleset for Cursor IDE

## Overview

This document provides a comprehensive ruleset for naming internationalization (i18n) keys and keysets in Cursor IDE projects. Following these conventions ensures consistency, maintainability, and clarity in multilingual applications.

## 1. Keyset Naming Rules

### 1.1 Keyset Types

Keysets are divided into 4 categories:

1. **System-wide** - Used across many sections (e.g., `common`, `common.units`, `common.operations`)
2. **Section-wide** - Common within a section (e.g., `billing.common`)
3. **Page-specific** - Specific to section pages (e.g., `billing.account`)
4. **Reusable components** - For shared components (e.g., `logs.events`)

### 1.2 Keyset Naming Conventions

- **MUST**: Write context description for each keyset
- **MUST**: Keep keysets concise (prefer `billing.budgets` over `billing.account.budgets`)
- **MUST NOT**: Create keysets with only a few keys - merge with existing section keysets
- **MUST NOT**: Create multiple keysets for sections/popups within the same area
- **MUST NOT**: Start reusable component keysets with `component.` - use the section name instead

## 2. Key Naming Rules

### 2.1 Key Format

Keys follow the pattern: `<element-context>_<content-text>`

### 2.2 Context Prefixes

Use these standard context prefixes:

| Prefix    | Usage                                               | Example                             |
| --------- | --------------------------------------------------- | ----------------------------------- |
| `context` | Contextual information, hints, section descriptions | `context_save-up-and-service-sales` |
| `alert`   | System feedback, notifications, warnings            | `alert_load-document-error`         |
| `action`  | User actions: buttons, links, menu items            | `action_document-view`              |
| `field`   | Resource field names in tables, forms, overviews    | `field_account-name`                |
| `title`   | Titles of sections, pages, popups, menu items       | `title_billing-section`             |
| `confirm` | Confirmation prompts and calls to action            | `confirm_delete-resource`           |
| `value`   | Radio button values, statuses, field values         | `value_active-status`               |

### 2.3 Key Naming Guidelines

- **MUST**: Make content description unambiguous and concise
- **MUST**: Use hyphens to separate words in content description
- **MUST NOT**: Use `label_` prefix (deprecated)
- **SHOULD**: If context cannot be determined, omit the prefix

### 2.4 Examples

| Text                                                        | Key                         |
| ----------------------------------------------------------- | --------------------------- |
| Error loading document (notification title)                 | `alert_load-document-error` |
| Report document not ready, try later (notification message) | `alert_act-not-ready-error` |
| Scheduled maintenance on 12.02.2022 14:00-15:00             | `alert_planned-maintenance` |
| View document (button)                                      | `action_document-view`      |

## 3. Technical Prefixes

### 3.1 Special Processing Prefixes

| Prefix | Purpose                      | Processing                           |
| ------ | ---------------------------- | ------------------------------------ |
| `raw_` | Bypass typography processing | Text displayed as-is                 |
| `md_`  | Enable markdown formatting   | Supports **bold**, _italic_, [links] |

### 3.2 Formatting Rules

- **MUST NOT**: Use HTML markup in text
- **MUST**: Use YFM markdown syntax for formatting
- **CAN**: Add link attributes using markdown syntax:
  ```json
  {
    "md_example-key": "Learn [more](https://example.com){target=_blank rel=\"noreferrer noopener\"}"
  }
  ```

## 4. Character Restrictions

### 4.1 Allowed Characters

Keys must only contain characters matching this pattern:

```regex
^[a-z0-9\u0400-\u04ff[\](){}<>!@#$%^&*~_\-−–—+='"`«»„"''"?.,:;|\\/ ₽™®©№\u00a0]*$/i
```

This includes:

- Latin letters (a-z, A-Z)
- Numbers (0-9)
- Cyrillic letters (\u0400-\u04ff)
- Common punctuation and symbols
- Non-breaking space (\u00a0)
- Currency symbols (₽)
- Special characters (™®©№)

## 5. Best Practices

### 5.1 DO's

- ✅ Keep keys descriptive but concise
- ✅ Group related keys in appropriate keysets
- ✅ Use consistent naming patterns within a project
- ✅ Document keyset context and purpose
- ✅ Review existing keys before creating new ones

### 5.2 DON'Ts

- ❌ Don't create overly granular keysets
- ❌ Don't duplicate keys across keysets
- ❌ Don't use technical jargon in user-facing keys
- ❌ Don't include implementation details in key names
- ❌ Don't use special characters outside the allowed set

## 6. Regional Keys

For region-specific content, use appropriate postfixes as defined in the regional keys documentation.

## 7. Validation Checklist

Before finalizing i18n keys, verify:

- [ ] Key follows `<context>_<content>` format
- [ ] Context prefix is from the standard list
- [ ] Content description is clear and concise
- [ ] Key is placed in appropriate keyset
- [ ] No forbidden characters are used
- [ ] Formatting prefixes (`raw_`, `md_`) are used correctly
- [ ] No HTML markup in text values

## 8. Examples Summary

```json
{
  "common": {
    "action_save": "Save",
    "action_cancel": "Cancel",
    "field_name": "Name",
    "field_description": "Description"
  },
  "billing.account": {
    "title_billing-overview": "Billing Overview",
    "alert_payment-failed": "Payment processing failed",
    "context_billing-help": "Manage your billing accounts and payment methods",
    "confirm_delete-account": "Are you sure you want to delete this account?"
  },
  "logs.events": {
    "field_timestamp": "Timestamp",
    "value_error-level": "Error",
    "action_filter-logs": "Filter logs"
  }
}
```

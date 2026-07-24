# Current Query Under Cursor Design

## Goal

Let the query editor identify and highlight the YQL statement under the cursor, then
execute that statement through the existing “selected query” action when the user has
not selected text manually.

## User Experience

The editor continuously highlights the statement containing the cursor.

Execution behavior:

- Run button and `Ctrl/Cmd+Enter` continue to execute the complete editor contents.
- `Ctrl/Cmd+Shift+Enter` executes the manual selection when it is non-empty.
- `Ctrl/Cmd+Shift+Enter` executes the highlighted statement when there is no manual
  selection.
- The matching context-menu action follows the same selection-first behavior.
- Explain behavior remains unchanged.
- When the cursor is outside a recognized statement, for example on a blank separator
  line or in a standalone comment, there is no statement highlight and the partial
  execution action is unavailable.

The highlight is the source of truth: the automatically selected text and the text sent
for execution are always the same range.

## Statement Detection

Use the existing
`extractYqlStatementPositionsFromQuery()` export from
`@gravity-ui/websql-autocomplete/yql`. The dependency is already used by the project,
understands YQL tokens and syntax, and handles semicolons inside strings and comments.

Statement positions are recalculated when the current Monaco model content changes or
when the editor switches to another tab model. Cursor movement only selects a statement
from the cached positions, avoiding a full parse on every cursor event.

A statement contains the cursor when the Monaco cursor offset is greater than or equal
to the statement start and less than the statement end. The statement end includes its
terminating semicolon. Gaps between returned statement ranges do not belong to either
statement.

For incomplete or invalid YQL, the extractor can use token-based recovery or return a
coarser range. The editor must still execute only the visibly highlighted range. If no
non-empty range is returned for the cursor position, partial execution is disabled.

## Editor Integration

Keep statement detection and decoration ownership inside `YqlEditor`, because Monaco
models, cursor positions, ranges, and decorations are editor-specific state.

Create a small pure utility that:

- receives editor text, cursor offset, and extracted statement positions;
- returns the matching `{text, startIndex, endIndex}` or `undefined`;
- resolves manual selection separately, with manual selection taking priority during
  execution.

`YqlEditor` owns:

- cached statement positions for the active Monaco model version;
- a Monaco decorations collection for the current statement;
- listeners for model content, model replacement, cursor position, and selection;
- the existing context key, broadened from “has selected text” to “has an executable
  selection or current statement”.

The statement decoration uses an exact text range rather than a whole-line decoration,
so two statements on the same line remain visually distinguishable. The background
must use an existing Gravity UI theme variable and remain visibly different from both
the current-line marker and Monaco's manual selection.

All listeners, scheduled recalculations, context keys, and decorations are disposed or
cleared when the editor unmounts. Switching query tabs must not leave decorations on
the previous tab model.

## Execution and History

Replace the ambiguous `partial?: boolean` argument with an explicit execution
descriptor:

```ts
type QueryExecutionSource = 'editor' | 'selection' | 'current-statement';

interface QueryExecution {
  text: string;
  source: QueryExecutionSource;
  range?: Monaco.IRange;
}
```

The Run button and regular send action create an `editor` execution. The partial action
creates a `selection` or `current-statement` execution.

Every execution attempt is represented in History by the user-authored text that was
actually submitted:

- `editor` stores the full editor value;
- `selection` stores the exact selected text;
- `current-statement` stores the exact highlighted statement.

Implicit pragmas added from query execution settings are not copied into History,
matching current behavior. Failed and stopped executions remain in History with their
resulting status. Existing consecutive-query deduplication applies equally to full and
fragment executions.

Only an `editor` execution clears the tab's dirty state. Running a selection or current
statement must not mark the complete editor contents as clean.

Each fragment execution receives the correct `historyQueryId`. It must not reuse and
then update an unrelated previously selected History item.

## Error Positions

Store the source range of the executed fragment with the active query result. Backend
issue coordinates for a fragment are relative to the fragment; before displaying or
navigating to an issue position, translate them to editor coordinates:

- add `startLineNumber - 1` to every issue row;
- for positions on the fragment's first row only, add `startColumn - 1` to the column;
- apply the same translation recursively to nested issues and end positions.

Full-editor executions require no source offset. The displayed query text remains the
unmodified user-authored fragment.

## Scope

This change does not:

- make Run or `Ctrl/Cmd+Enter` execute the current statement;
- alter Explain execution;
- automatically include preceding `DECLARE`, `PRAGMA`, variable assignments, or other
  dependent statements;
- add a new toolbar button or setting;
- change query settings persistence.

If a highlighted statement depends on earlier statements, the backend may reject the
standalone fragment. This is preferable to silently executing text outside the visible
highlight.

## Verification

Pure utility tests cover:

- one and multiple statements;
- multiline statements and multiple statements on one line;
- semicolons in quoted strings and comments;
- standalone comments and whitespace between statements;
- cursor positions at statement boundaries;
- Unicode before and inside statements;
- incomplete syntax and extractor recovery;
- manual selection priority.

Query history tests cover:

- full editor, selection, and current-statement text;
- dirty-state behavior for each source;
- consecutive duplicate handling;
- failed and stopped fragment statuses;
- fragment execution after navigating through History.

End-to-end tests cover:

- highlight movement as the cursor changes statements;
- no highlight between statements;
- `Ctrl/Cmd+Shift+Enter` executing the current statement without a selection;
- a manual selection overriding the current statement;
- Run and `Ctrl/Cmd+Enter` still executing the complete editor contents;
- correct decoration and execution after switching editor tabs;
- issue navigation from a fragment result to the correct original editor position.

Run focused unit tests first, then the query-editor Playwright suite, followed by
`npm run typecheck` and `npm run lint`.

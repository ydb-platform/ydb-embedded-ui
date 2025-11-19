# GitHub Issues to Create

This document contains templates for 11 feature requests that need to be created as GitHub issues in the ydb-platform/ydb-embedded-ui repository.

---

## Issue 1: Save Query History

**Title:** feat: save query history

**Description:**

Implement functionality to save and persist query history in the SQL Editor.

**Requirements:**
- Store executed queries in local storage or database
- Display query history in the SQL Editor interface
- Allow users to view and reuse previously executed queries
- Include timestamps for when queries were executed
- Provide search/filter capabilities for query history

**Benefits:**
- Improves user productivity by allowing quick access to previously used queries
- Reduces time spent rewriting common queries
- Helps users track their work and debugging process

**Related Areas:**
- SQL Editor
- Query execution

---

## Issue 2: Download Query Results

**Title:** feat: download query results

**Description:**

Add ability to download query execution results in various formats.

**Requirements:**
- Support multiple export formats (CSV, JSON, Excel)
- Handle large result sets efficiently
- Provide download button in query results interface
- Allow users to choose which columns to export
- Support pagination for large datasets

**Benefits:**
- Enables offline analysis of query results
- Facilitates data sharing and reporting
- Improves data portability

**Related Areas:**
- SQL Editor
- Query results display

---

## Issue 3: Charts for Query Results

**Title:** feat: add charts for query results visualization

**Description:**

Implement charting capabilities to visualize query results directly in the UI.

**Requirements:**
- Support common chart types (line, bar, pie, scatter)
- Auto-detect suitable chart types based on data
- Provide interactive chart configuration
- Allow chart export/download
- Integrate with existing query results display

**Benefits:**
- Enables quick data analysis and pattern recognition
- Reduces need for external visualization tools
- Improves understanding of query results

**Related Areas:**
- SQL Editor
- Query results display
- Data visualization

**Dependencies:**
- Already using @gravity-ui/chartkit in the project

---

## Issue 4: Display Resource Pools

**Title:** feat: show resource pools information

**Description:**

Add interface to view and monitor resource pools in the cluster.

**Requirements:**
- Display list of available resource pools
- Show resource pool configuration and properties
- Display current resource usage per pool
- Provide filtering and sorting capabilities
- Show resource pool assignment to databases/queries

**Benefits:**
- Improves visibility into resource management
- Helps administrators understand resource allocation
- Facilitates capacity planning

**Related Areas:**
- Cluster administration
- Resource management
- Diagnostics

---

## Issue 5: Specify Resource Pools for Query Execution

**Title:** feat: ability to specify resource pools when running queries

**Description:**

Allow users to select and specify resource pools when executing queries in the SQL Editor.

**Requirements:**
- Add resource pool selector in query execution interface
- Display available resource pools with their current status
- Save user's resource pool preferences
- Show feedback when query is executed with specific resource pool
- Validate resource pool availability before query execution

**Benefits:**
- Enables better resource management and query isolation
- Allows users to control query priority and resource usage
- Helps prevent resource contention

**Related Areas:**
- SQL Editor
- Query execution
- Resource management

**Dependencies:**
- Requires Issue #4 (Display Resource Pools) to be implemented first

---

## Issue 6: Display Column Compression Coefficient for Columnar Tables

**Title:** feat: display compression coefficient for columnar table columns

**Description:**

Show compression statistics for individual columns in columnar tables.

**Requirements:**
- Display compression ratio for each column
- Show original vs compressed size
- Add compression info to table schema view
- Provide aggregated compression statistics for entire table
- Update info when table structure changes

**Benefits:**
- Helps optimize storage usage
- Aids in schema design decisions
- Provides insights into data characteristics

**Related Areas:**
- Column-oriented tables
- Schema display
- Storage diagnostics

---

## Issue 7: Display Tiering Settings and Statistics for Columnar Tables

**Title:** feat: show tiering configuration and statistics for columnar tables

**Description:**

Add display of tiering settings and per-tier statistics for columnar tables.

**Requirements:**
- Show tiering configuration for each table
- Display data distribution across tiers
- Show storage usage per tier
- Display access patterns per tier
- Provide timeline view of data movement between tiers

**Benefits:**
- Improves visibility into data lifecycle management
- Helps optimize storage costs
- Facilitates tiering policy optimization

**Related Areas:**
- Column-oriented tables
- Storage management
- Diagnostics

---

## Issue 8: Display Volume of Data Read from Blob Storage

**Title:** feat: show query data read volume from blob storage

**Description:**

Display the amount of data read from blob storage for each query execution.

**Requirements:**
- Show data volume read from blob storage in query execution stats
- Display in human-readable format (KB, MB, GB)
- Include in query execution history
- Add to query plan/explain output
- Provide aggregated statistics for multiple query executions

**Benefits:**
- Helps understand query performance characteristics
- Aids in query optimization
- Facilitates cost analysis for cloud deployments

**Related Areas:**
- SQL Editor
- Query execution
- Performance diagnostics

---

## Issue 9: Display Subcolumns Settings for Columnar Tables

**Title:** feat: show subcolumns configuration for columnar tables

**Description:**

Add display of subcolumns settings and structure for columnar tables.

**Requirements:**
- Show subcolumns configuration in table schema view
- Display subcolumn data types and properties
- Show relationships between parent columns and subcolumns
- Provide statistics for subcolumn usage
- Update display when schema changes

**Benefits:**
- Improves understanding of complex columnar table structures
- Helps with schema design and optimization
- Provides better visibility into semi-structured data handling

**Related Areas:**
- Column-oriented tables
- Schema display
- Table info

---

## Issue 10: Specify Snapshot Isolation Level for Query Execution

**Title:** feat: ability to specify snapshot isolation level when running queries

**Description:**

Allow users to specify snapshot isolation transaction level when executing queries.

**Requirements:**
- Add isolation level selector in query execution interface
- Support snapshot read isolation level
- Display current isolation level in query editor
- Provide information about isolation level implications
- Save user preferences for isolation level

**Benefits:**
- Enables consistent reads across long-running transactions
- Provides better control over transaction behavior
- Supports advanced use cases requiring specific isolation guarantees

**Related Areas:**
- SQL Editor
- Query execution
- Transaction management

---

## Issue 11: Display Skip Indexes Structure for Columnar Tables

**Title:** feat: show skip indexes structure for columnar tables

**Description:**

Display skip indexes configuration and statistics for columnar tables.

**Requirements:**
- Show list of skip indexes for each columnar table
- Display index structure and configuration
- Show index statistics (size, coverage, effectiveness)
- Provide index usage information in query plans
- Display index build status and progress

**Benefits:**
- Improves query performance optimization
- Helps understand index effectiveness
- Facilitates index management and tuning

**Related Areas:**
- Column-oriented tables
- Schema display
- Query optimization
- Indexes

---

## Implementation Notes

These features are related to enhancing the YDB Embedded UI capabilities for:
1. Query development and execution workflow improvements (Issues 1, 2, 3, 5, 10)
2. Resource management visibility (Issues 4, 5)
3. Columnar table-specific features (Issues 6, 7, 9, 11)
4. Performance monitoring and diagnostics (Issue 8)

Some features may have dependencies on backend API availability and should be coordinated with YDB core development.

## Priority Suggestions

**High Priority:**
- Issue 1: Save Query History
- Issue 2: Download Query Results
- Issue 4: Display Resource Pools

**Medium Priority:**
- Issue 3: Charts for Query Results
- Issue 5: Specify Resource Pools for Query Execution
- Issue 8: Display Volume of Data Read from Blob Storage

**Low Priority (Requires Backend Support):**
- Issue 6: Display Column Compression Coefficient
- Issue 7: Display Tiering Settings and Statistics
- Issue 9: Display Subcolumns Settings
- Issue 10: Specify Snapshot Isolation Level
- Issue 11: Display Skip Indexes Structure

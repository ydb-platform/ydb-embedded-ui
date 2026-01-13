# YDB Embedded UI Roadmap

## Legend

We use the following symbols as abbreviations:

1. ㉕ - feature appeared in the Roadmap for 2025;
1. ㉔ - feature appeared in the Roadmap for 2024;
1. ✅ - feature has been released;
1. 🚧 - feature is partially available and is under development;
1. ❌ - feature has been refused;
1. 🔥 - not yet released, but we are in rush.

## Diagnostics

1. ✅ ㉔ **Capacity diagnostics** – a set of signals on a database info tab to easily diagnose CPU or storage shortage
1. ✅ ㉔ **Basic built-in charts** – support for charts display for most popular signals: resource consumption, requests and latency
1. ✅ ㉔ **Display Table Hot Keys** – on a tab **Hot Keys** for a [column-oriented](https://ydb.tech/docs/en/concepts/datamodel/table#olap-data-types) and [row-oriented table](https://ydb.tech/docs/en/concepts/datamodel/table#row-orineted_table) display Hot Keys based on query statistics
1. ✅ **Tablets Tab** – improved list of tablets in database and cluster with filters and search
1. ✅ **Network diagnostics** – display signals about cluster network performance and help to discover reasons for potential problems

## Cluster Administration

1. ✅ **VDisk Eviction** – a special page for [VDisk](https://ydb.tech/docs/en/concepts/cluster/distributed_storage) with infos and support for [VDisk eviction](https://ydb.tech/docs/en/maintenance/manual/moving_vdisks) launch
1. ✅ **PDisk restart** – easy way to restart PDisk with one click from its page
1. ㉔ **Display Configuration** – easy way to find out the value of any configuration paramater for a cluster or database
1. ㉕ **Edit Configuration** – change the value of any configuration paramater for a cluster or database
1. ㉕ **Storage Nodes with more than 100+ devices** – support storage nodes with multiple storage devices
1. ㉕ **Easy Cluster Initial Setup** – add support for semiautomatic cluster bootstrap via wizard-like UI

## Query and Schema Development

1. ✅ **Autocompletion** – autosuggestions to complete sql keywords and schema elements' names
1. ✅ **Support VIEWS** – basic support for new schema object type – `VIEW`
1. ✅ **Support Asyncronous Replication** – basic support for new feature – cluster-to-cluster asyncrounous replication
1. ✅ **Display Keys and Column Families** – add wider schema tab in Diagnostics mode with information about column families, primary and partitioning keys.
1. ✅ **Enhance Column Tables support** – display all parameters from `CREATE TABLE` statement on info Tab, add create/alter queries templates
1. ✅ **Query Plan Improvements** – add textual representation of the query execution plan and display physical path of the query
1. ✅ ㉓ **Support YDB Topics** (add support for viewing metadata of YDB topics, its data, lag, etc)
1. ✅ ㉓ **Support CDC Streams**
1. ✅ ㉓ **Support Secondary Indexes**
1. ✅ ㉓ **Support Read Replicas**
1. ✅ ㉓ **Support Column-oriented Tables**

## Appearence

1. ✅ **Change Table Column Width** – make it possible to alter a column (e.g. on a nodes page) width by dragging

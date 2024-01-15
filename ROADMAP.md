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

1. 🚧 **Capacity diagnostics** – a set of signals on a database info tab to easily diagnose CPU or storage shortage
1. 🔥 **Basic built-in charts** – support for charts display for most popular signals: resource consumption, requests and latency
1. 🔥 **Display Table Hot Keys** – on a tab **Hot Keys** for a [column-oriented](https://ydb.tech/docs/en/concepts/datamodel/table#olap-data-types) and [row-oriented table](https://ydb.tech/docs/en/concepts/datamodel/table#row-orineted_table) display Hot Keys based on query statistics
1. ㉔ **Network diagnostics** – display signals about cluster network performance and help to discover reasons for potential problems


## Cluster Administration

1. ㉔ **VDisk Eviction** – a special page for [VDisk](https://ydb.tech/docs/en/concepts/cluster/distributed_storage) with infos and support for [VDisk eviction](https://ydb.tech/docs/en/maintenance/manual/moving_vdisks) launch
1. ㉔ **PDisk restart** – easy way to restart PDisk with one click from its page
1. ㉔ **Display Configuration** – easy way to find out the value of any configuration paramater for a cluster or database
1. ㉕ **Edit Configuration** – change the value of any configuration paramater for a cluster or database

## Query and Schema Development

1. 🔥 **Autocompletion** – autosuggestions to complete sql keywords and schema elements' names
1. ㉔ **Support VIEWS** – basic support for new schema object type – `VIEW`
1. ㉔ **Support Asyncronous Replication** – basic support for new feature – cluster-to-cluster asyncrounous replication 
1. ㉔ **Display Keys and Column Families** – add wider schema tab in Diagnostics mode with information about column families, primary and partitioning keys.
1. ㉔ **Enhance Column Tables support** – display all parameters from `CREATE TABLE` statement on info Tab, add create/alter queries templates

## Appearence 

1. ㉕ **Change Table Column Width** – make it possible to alter a column (e.g. on a nodes page) width by dragging

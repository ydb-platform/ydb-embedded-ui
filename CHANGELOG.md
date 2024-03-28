# Changelog

## [5.5.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v5.4.0...v5.5.0) (2024-03-28)


### Features

* add databases label ([#774](https://github.com/ydb-platform/ydb-embedded-ui/issues/774)) ([7b8e473](https://github.com/ydb-platform/ydb-embedded-ui/commit/7b8e473845e0769575e3e35a3cd525fdfcdf02b9))


### Bug Fixes

* initial bundle size ([#776](https://github.com/ydb-platform/ydb-embedded-ui/issues/776)) ([b13344d](https://github.com/ydb-platform/ydb-embedded-ui/commit/b13344d3da2a91a6c76733100d34fb3bc3c0f8fa))
* **VirtualTable:** make table resizeable by default ([#772](https://github.com/ydb-platform/ydb-embedded-ui/issues/772)) ([fe6ad27](https://github.com/ydb-platform/ydb-embedded-ui/commit/fe6ad27e5b598191d8a3b5c3aeba94ff3377a164))

## [5.4.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v5.3.0...v5.4.0) (2024-03-23)


### Features

* **MetricChart:** display per pool cpu usage ([#769](https://github.com/ydb-platform/ydb-embedded-ui/issues/769)) ([6902afa](https://github.com/ydb-platform/ydb-embedded-ui/commit/6902afab43a635fa70f25aa9149e5c6802ec489b))
* **PDisk:** add restart button ([#766](https://github.com/ydb-platform/ydb-embedded-ui/issues/766)) ([7239727](https://github.com/ydb-platform/ydb-embedded-ui/commit/723972712a3aabfb519ec29a4c191096887d5a1b))


### Bug Fixes

* **MetricChart:** draw area charts ([#764](https://github.com/ydb-platform/ydb-embedded-ui/issues/764)) ([51eb1bf](https://github.com/ydb-platform/ydb-embedded-ui/commit/51eb1bf2a37805012630907774bee8f9b00affff))

## [5.3.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v5.2.1...v5.3.0) (2024-03-15)


### Features

* add PDisk page ([#759](https://github.com/ydb-platform/ydb-embedded-ui/issues/759)) ([c1d3f99](https://github.com/ydb-platform/ydb-embedded-ui/commit/c1d3f996f5b0f1c23cd7ba5e717fad3680ba63af))
* add setting to enable autocomplete, fix constants for completion ([#765](https://github.com/ydb-platform/ydb-embedded-ui/issues/765)) ([88cfc52](https://github.com/ydb-platform/ydb-embedded-ui/commit/88cfc5258eaf64a1b2e5ff6c1403f827e71ed54a))
* add YQL autocomplete ([#755](https://github.com/ydb-platform/ydb-embedded-ui/issues/755)) ([799a05f](https://github.com/ydb-platform/ydb-embedded-ui/commit/799a05fe3301d4be05c33bce8a44eb3018a199c7))
* **MetricChart:** make charts database specific ([#750](https://github.com/ydb-platform/ydb-embedded-ui/issues/750)) ([fa98a22](https://github.com/ydb-platform/ydb-embedded-ui/commit/fa98a2222e5be1d0fe83b90f99d73207eb93fc71))
* use rtk to init store and add typed dispatch ([#749](https://github.com/ydb-platform/ydb-embedded-ui/issues/749)) ([323cb6b](https://github.com/ydb-platform/ydb-embedded-ui/commit/323cb6b5de9204e40af2c2b80ca436edcddb686d))


### Bug Fixes

* add absent deps, update axios ([#756](https://github.com/ydb-platform/ydb-embedded-ui/issues/756)) ([ee723cd](https://github.com/ydb-platform/ydb-embedded-ui/commit/ee723cd8f7122949f388a8380ee05fe96c624ff3))
* add Blue status to EFlag ([#754](https://github.com/ydb-platform/ydb-embedded-ui/issues/754)) ([9a0b867](https://github.com/ydb-platform/ydb-embedded-ui/commit/9a0b867b45262919baaa7032f73cf44d415d3f27))
* fix status colors ([#757](https://github.com/ydb-platform/ydb-embedded-ui/issues/757)) ([9928ee2](https://github.com/ydb-platform/ydb-embedded-ui/commit/9928ee23ee55959eb2162de5c948c321ed849fe7))
* **MetricChart:** explicitly process error with html ([#752](https://github.com/ydb-platform/ydb-embedded-ui/issues/752)) ([6d8a0ba](https://github.com/ydb-platform/ydb-embedded-ui/commit/6d8a0ba454061db4edff948af86731bc6873a356))
* **Tablet:** correctly process error in dialog action ([#758](https://github.com/ydb-platform/ydb-embedded-ui/issues/758)) ([b6bcd68](https://github.com/ydb-platform/ydb-embedded-ui/commit/b6bcd686df4e092019da0d39e9da384930cf4a0a))
* **TEvDescribeSchemeResult:** support null value ([#762](https://github.com/ydb-platform/ydb-embedded-ui/issues/762)) ([72ce541](https://github.com/ydb-platform/ydb-embedded-ui/commit/72ce54159b237f607f971159d0bba4879dfea73c))

## [5.2.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v5.2.0...v5.2.1) (2024-03-05)


### Bug Fixes

* **Cluster:** make cluster title sticky ([#743](https://github.com/ydb-platform/ydb-embedded-ui/issues/743)) ([823709d](https://github.com/ydb-platform/ydb-embedded-ui/commit/823709d3d12992db86254ccdb4941ead1dc30295))
* display rack for din nodes ([#742](https://github.com/ydb-platform/ydb-embedded-ui/issues/742)) ([54384dd](https://github.com/ydb-platform/ydb-embedded-ui/commit/54384dd2447465109008f4053ba748241a1fa133))
* **QueryEditor:** rename actions ([#741](https://github.com/ydb-platform/ydb-embedded-ui/issues/741)) ([784c5b3](https://github.com/ydb-platform/ydb-embedded-ui/commit/784c5b3ca45aa9be77a25f253b5aae2bb4ecc88b))

## [5.2.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v5.1.0...v5.2.0) (2024-03-04)


### Features

* add binary data in plain text display ([#739](https://github.com/ydb-platform/ydb-embedded-ui/issues/739)) ([dd126b0](https://github.com/ydb-platform/ydb-embedded-ui/commit/dd126b0c03bef61110362596a15b5d069644c232))
* allow replace ErrorBoundary compponent ([#744](https://github.com/ydb-platform/ydb-embedded-ui/issues/744)) ([588c1f1](https://github.com/ydb-platform/ydb-embedded-ui/commit/588c1f165ced6087afc85f535abf3cd08733648d))

## [5.1.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v5.0.0...v5.1.0) (2024-02-29)


### Features

* **Cluster:** move cluster info to overview tab ([#710](https://github.com/ydb-platform/ydb-embedded-ui/issues/710)) ([7abcbc1](https://github.com/ydb-platform/ydb-embedded-ui/commit/7abcbc1148a981bd26240caec0809c45b06c3b98))
* do not use external settings ([#725](https://github.com/ydb-platform/ydb-embedded-ui/issues/725)) ([8af45b0](https://github.com/ydb-platform/ydb-embedded-ui/commit/8af45b073d986b3e6bbd25a0823df7fe78622f09))
* **HotKeys:** revive ([#722](https://github.com/ydb-platform/ydb-embedded-ui/issues/722)) ([8047fe4](https://github.com/ydb-platform/ydb-embedded-ui/commit/8047fe431733f3838021fc0e4074179a8a8a75c4))
* **QueryEditor:** execute query with selected text ([#737](https://github.com/ydb-platform/ydb-embedded-ui/issues/737)) ([122a006](https://github.com/ydb-platform/ydb-embedded-ui/commit/122a0069ba96857cd0377a76cbf744735d287c45))
* show different page titles on different pages ([#733](https://github.com/ydb-platform/ydb-embedded-ui/issues/733)) ([4881f09](https://github.com/ydb-platform/ydb-embedded-ui/commit/4881f090f1c808b3bd0baf2cbf2e71373bb5d641))
* **TopQueries:** add Duration column ([#711](https://github.com/ydb-platform/ydb-embedded-ui/issues/711)) ([3f6a892](https://github.com/ydb-platform/ydb-embedded-ui/commit/3f6a892e42a12a5575253e6e93078195a7212a57))


### Bug Fixes

* configure i18n for libs ([#724](https://github.com/ydb-platform/ydb-embedded-ui/issues/724)) ([c0b7c7d](https://github.com/ydb-platform/ydb-embedded-ui/commit/c0b7c7d21048a35462cf1c4f27a5348e2a9692b1))
* **ExecuteResults:** escape values in table cells when copy as tsv ([#720](https://github.com/ydb-platform/ydb-embedded-ui/issues/720)) ([de40fe6](https://github.com/ydb-platform/ydb-embedded-ui/commit/de40fe611da78fd7f38f429c1f175aed110874b7))
* pass route component props to slot ([#716](https://github.com/ydb-platform/ydb-embedded-ui/issues/716)) ([51e7872](https://github.com/ydb-platform/ydb-embedded-ui/commit/51e7872908f691ef6e84995425b1d169045ebddd))
* **ProgressViewer:** make text more contrast ([#714](https://github.com/ydb-platform/ydb-embedded-ui/issues/714)) ([e09ec79](https://github.com/ydb-platform/ydb-embedded-ui/commit/e09ec792a99df38e7f742defe03bcc8850967abe))
* remove console log on monitoring data parsing error ([#723](https://github.com/ydb-platform/ydb-embedded-ui/issues/723)) ([f73dbc8](https://github.com/ydb-platform/ydb-embedded-ui/commit/f73dbc8a735179e8466d6fbd08325cdf76790e1d))
* **TopQueries:** use EndTime ([#727](https://github.com/ydb-platform/ydb-embedded-ui/issues/727)) ([5e708ca](https://github.com/ydb-platform/ydb-embedded-ui/commit/5e708cad9c98530e64dbebd195edb43fea360830))
* update tenant cpu ([#736](https://github.com/ydb-platform/ydb-embedded-ui/issues/736)) ([775bacf](https://github.com/ydb-platform/ydb-embedded-ui/commit/775bacfda549e5cea09ea03069908a59c12c0c3e))
* update tenant storage ([#726](https://github.com/ydb-platform/ydb-embedded-ui/issues/726)) ([dc0df8a](https://github.com/ydb-platform/ydb-embedded-ui/commit/dc0df8ab09d6a3953279d6be52d245a64c78680c))
* use DC and Rack from Location for nodes ([#713](https://github.com/ydb-platform/ydb-embedded-ui/issues/713)) ([e64c3b0](https://github.com/ydb-platform/ydb-embedded-ui/commit/e64c3b065dd07f8c2b1b7f131e52ed01e2f579fb))

## [5.0.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.33.0...v5.0.0) (2024-02-13)


### Features

* add multi clusters support ([#701](https://github.com/ydb-platform/ydb-embedded-ui/issues/701)) ([429aa0e](https://github.com/ydb-platform/ydb-embedded-ui/commit/429aa0e2138c4635f5c0ab26ba07901ec0d0162d))

## [4.33.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.32.0...v4.33.0) (2024-02-07)


### Features

* **VirtualTable:** enable columns resize ([#697](https://github.com/ydb-platform/ydb-embedded-ui/issues/697)) ([907b275](https://github.com/ydb-platform/ydb-embedded-ui/commit/907b2751541575cde3effcf5359a19cd9b6adffa))


### Bug Fixes

* **TableInfo:** format partitions count ([#704](https://github.com/ydb-platform/ydb-embedded-ui/issues/704)) ([2271535](https://github.com/ydb-platform/ydb-embedded-ui/commit/2271535964e4dcf72a3205f61769abfbb22543d4))
* **TenantDashboard:** hide if charts not enabled ([#675](https://github.com/ydb-platform/ydb-embedded-ui/issues/675)) ([fe0cad4](https://github.com/ydb-platform/ydb-embedded-ui/commit/fe0cad4e37e6b9dc8b8e9b5aeca882e798ec0cce))

## [4.32.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.31.2...v4.32.0) (2024-02-07)


### Features

* use VirtualTable in Nodes and Diagnostics ([#678](https://github.com/ydb-platform/ydb-embedded-ui/issues/678)) ([9158050](https://github.com/ydb-platform/ydb-embedded-ui/commit/91580507abf8dd4ac7d2ce070f83e9838ddd4bda))

## [4.31.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.31.1...v4.31.2) (2024-02-01)


### Bug Fixes

* **VirtualTable:** optimise requests ([#676](https://github.com/ydb-platform/ydb-embedded-ui/issues/676)) ([9a50a34](https://github.com/ydb-platform/ydb-embedded-ui/commit/9a50a34110eeeeddc0bf83cc5626bca30804ac1a))

## [4.31.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.31.0...v4.31.1) (2024-02-01)


### Bug Fixes

* **MetricChart:** do not convert nulls ([#677](https://github.com/ydb-platform/ydb-embedded-ui/issues/677)) ([c51c7aa](https://github.com/ydb-platform/ydb-embedded-ui/commit/c51c7aa1b6fb84342ab38466726175077cd7ef2e))

## [4.31.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.31.0...v4.31.0) (2024-01-31)


### Features

* **TenantOverview:** add charts ([#657](https://github.com/ydb-platform/ydb-embedded-ui/issues/657)) ([78daa0b](https://github.com/ydb-platform/ydb-embedded-ui/commit/78daa0bc5a1eb66d0bb0b88ccb559335294e44a7))

## [4.30.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.29.0...v4.30.0) (2024-01-16)


### Features

* add clipboard button to nodes tree titles ([#648](https://github.com/ydb-platform/ydb-embedded-ui/issues/648)) ([1411651](https://github.com/ydb-platform/ydb-embedded-ui/commit/141165173189be064e9e9314b42aa3eb7fce9c69))

## [4.29.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.28.0...v4.29.0) (2024-01-12)


### Features

* add ErrorBoundary ([#549](https://github.com/ydb-platform/ydb-embedded-ui/issues/549)) ([f5ad224](https://github.com/ydb-platform/ydb-embedded-ui/commit/f5ad224b342e0fa25b1bafa3f5e2202ce165ef80))

## [4.28.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.27.1...v4.28.0) (2024-01-10)


### Features

* **Storage:** use VirtualTable ([#628](https://github.com/ydb-platform/ydb-embedded-ui/issues/628)) ([67fd9b0](https://github.com/ydb-platform/ydb-embedded-ui/commit/67fd9b03653dd28be650094c987451b09fcce858))

## [4.27.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.27.0...v4.27.1) (2024-01-10)


### Bug Fixes

* enable extract and set user settings manually ([#629](https://github.com/ydb-platform/ydb-embedded-ui/issues/629)) ([5eecd58](https://github.com/ydb-platform/ydb-embedded-ui/commit/5eecd58249688b4a8b3ecad766564f7b404e839c))

## [4.27.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.26.0...v4.27.0) (2023-12-28)


### Features

* migrate from external settings api ([#621](https://github.com/ydb-platform/ydb-embedded-ui/issues/621)) ([ae2fbbe](https://github.com/ydb-platform/ydb-embedded-ui/commit/ae2fbbef66d9aba150012027baf8b89bf79cd741))

## [4.26.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.25.0...v4.26.0) (2023-12-14)


### Features

* update to uikit5 ([#607](https://github.com/ydb-platform/ydb-embedded-ui/issues/607)) ([ddd263b](https://github.com/ydb-platform/ydb-embedded-ui/commit/ddd263bd39d4de262e6c891dce6c6ff6ba2a3379))

## [4.25.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.24.0...v4.25.0) (2023-12-07)


### Features

* **Diagnostics:** remove tenant diagnostics cards setting ([#602](https://github.com/ydb-platform/ydb-embedded-ui/issues/602)) ([fe61df8](https://github.com/ydb-platform/ydb-embedded-ui/commit/fe61df86048013432c4e4788d1e621298ecb1fb2))
* **Query:** remove query modes setting ([#600](https://github.com/ydb-platform/ydb-embedded-ui/issues/600)) ([78c63e4](https://github.com/ydb-platform/ydb-embedded-ui/commit/78c63e4a2e60950970914eaba49304b68aad0f80))

## [4.24.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.23.0...v4.24.0) (2023-12-07)


### Features

* always use localStorage if no settingsApi ([#603](https://github.com/ydb-platform/ydb-embedded-ui/issues/603)) ([ff692df](https://github.com/ydb-platform/ydb-embedded-ui/commit/ff692dffa99d278f6b261bbf1aac0ee24c661a6d))

## [4.23.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.22.0...v4.23.0) (2023-12-06)


### Features

* **ClusterInfo:** display groups stats ([#598](https://github.com/ydb-platform/ydb-embedded-ui/issues/598)) ([c31d048](https://github.com/ydb-platform/ydb-embedded-ui/commit/c31d0480a1b91cf01a660fd1d9726c6708f7c252))
* **TenantOverview:** add links to sections titles ([#599](https://github.com/ydb-platform/ydb-embedded-ui/issues/599)) ([30401fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/30401fa354d90943bc4af4ddbf65466ce10381f9))


### Bug Fixes

* **Schema:** display keys in right order ([#596](https://github.com/ydb-platform/ydb-embedded-ui/issues/596)) ([c99b7e2](https://github.com/ydb-platform/ydb-embedded-ui/commit/c99b7e2e97acffc1cab450dfbf758c38b8b6e4d5))

## [4.22.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.21.1...v4.22.0) (2023-11-27)


### Features

* **Query:** enable queries with multiple resultsets ([#595](https://github.com/ydb-platform/ydb-embedded-ui/issues/595)) ([2eedfb6](https://github.com/ydb-platform/ydb-embedded-ui/commit/2eedfb6ec3be932c7399bb67de901798c0b31b50))
* **TenantOverview:** add columns to memory table ([#593](https://github.com/ydb-platform/ydb-embedded-ui/issues/593)) ([6379577](https://github.com/ydb-platform/ydb-embedded-ui/commit/6379577782cfa69de9fb39640d2a143f1670be39))


### Bug Fixes

* fix disks developer UI links for paths with nodeId ([#594](https://github.com/ydb-platform/ydb-embedded-ui/issues/594)) ([7f5a783](https://github.com/ydb-platform/ydb-embedded-ui/commit/7f5a78393d0c23e584ad73040fd0e73d404e5d01))
* **TopShards:** sort by InFlightTxCount ([#591](https://github.com/ydb-platform/ydb-embedded-ui/issues/591)) ([eb3592d](https://github.com/ydb-platform/ydb-embedded-ui/commit/eb3592d69a465814de27e8b1e368b34cc60fed2f))

## [4.21.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.21.0...v4.21.1) (2023-11-17)


### Bug Fixes

* move inverted disk space setting to general page ([#589](https://github.com/ydb-platform/ydb-embedded-ui/issues/589)) ([b09345e](https://github.com/ydb-platform/ydb-embedded-ui/commit/b09345e1ebe9e7a47beea5ab2dac4257790232cc))
* **Nodes:** always use nodes when flag is enabled ([#584](https://github.com/ydb-platform/ydb-embedded-ui/issues/584)) ([6ac6ee2](https://github.com/ydb-platform/ydb-embedded-ui/commit/6ac6ee2516bb2612cc7832e67ffa0bf92615a36c))
* **QueryResultTable:** fix table error on null cell sort ([#590](https://github.com/ydb-platform/ydb-embedded-ui/issues/590)) ([805a339](https://github.com/ydb-platform/ydb-embedded-ui/commit/805a339b0bba34412bf8e854cf6d24ae7c080539))
* **Tablets:** reduce rerenders ([#585](https://github.com/ydb-platform/ydb-embedded-ui/issues/585)) ([f1767a1](https://github.com/ydb-platform/ydb-embedded-ui/commit/f1767a143b139de4cd7c0df5c8c243c0224ebd3c))
* turn on query modes and metrics cards by default ([#588](https://github.com/ydb-platform/ydb-embedded-ui/issues/588)) ([c2f0d74](https://github.com/ydb-platform/ydb-embedded-ui/commit/c2f0d7424cb3182926f125a1e8c16cd4a2d422b9))
* update links to VDisk and PDisk Developer UI ([#582](https://github.com/ydb-platform/ydb-embedded-ui/issues/582)) ([97dda88](https://github.com/ydb-platform/ydb-embedded-ui/commit/97dda88bd595295eefaed4c0cbcd333e84b047f0))
* **VirtualNodes:** display developerUI link on hover ([#587](https://github.com/ydb-platform/ydb-embedded-ui/issues/587)) ([ba6c249](https://github.com/ydb-platform/ydb-embedded-ui/commit/ba6c249a9793b0bac45607b0b36f284dea4e0a7a))

## [4.21.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.20.4...v4.21.0) (2023-10-27)


### Features

* add VirtualTable, use for Nodes ([#578](https://github.com/ydb-platform/ydb-embedded-ui/issues/578)) ([d6197d4](https://github.com/ydb-platform/ydb-embedded-ui/commit/d6197d4bebf509596dfff4e1b4a7fe51a847424e))

## [4.20.4](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.20.3...v4.20.4) (2023-10-27)


### Bug Fixes

* **Storage:** set storage true for nodes ([#579](https://github.com/ydb-platform/ydb-embedded-ui/issues/579)) ([146d235](https://github.com/ydb-platform/ydb-embedded-ui/commit/146d23563ef50461260f13eedf66ad7da9f76c8a))

## [4.20.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.20.2...v4.20.3) (2023-10-25)


### Bug Fixes

* fix port doesnt match ([#576](https://github.com/ydb-platform/ydb-embedded-ui/issues/576)) ([147a2a9](https://github.com/ydb-platform/ydb-embedded-ui/commit/147a2a919c5fe8ec99f19620da70387ab6c0e519))

## [4.20.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.20.1...v4.20.2) (2023-10-25)


### Bug Fixes

* fix diagnostics top queries width ([#574](https://github.com/ydb-platform/ydb-embedded-ui/issues/574)) ([afa17f2](https://github.com/ydb-platform/ydb-embedded-ui/commit/afa17f236331692167a0a37936b090a8baa772df))
* fix sticky storage info ([#573](https://github.com/ydb-platform/ydb-embedded-ui/issues/573)) ([4b923d1](https://github.com/ydb-platform/ydb-embedded-ui/commit/4b923d1db73c53c63e95f43487127b4c2c1e4cac))
* use UsageLabel in top groups by usage table ([#572](https://github.com/ydb-platform/ydb-embedded-ui/issues/572)) ([752888d](https://github.com/ydb-platform/ydb-embedded-ui/commit/752888d26ac2cab75307011fb1354830b1cb6db6))

## [4.20.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.20.0...v4.20.1) (2023-10-24)


### Bug Fixes

* fix createExternalUILink ([#571](https://github.com/ydb-platform/ydb-embedded-ui/issues/571)) ([52546f1](https://github.com/ydb-platform/ydb-embedded-ui/commit/52546f17dbfdb255b2429836e880d6812b19d66a))
* fix incorrect truncate strings with popover ([#567](https://github.com/ydb-platform/ydb-embedded-ui/issues/567)) ([d82e65b](https://github.com/ydb-platform/ydb-embedded-ui/commit/d82e65b925b76dc539a76520eccf601951654e94))
* fix top queries table row height ([#565](https://github.com/ydb-platform/ydb-embedded-ui/issues/565)) ([b12dceb](https://github.com/ydb-platform/ydb-embedded-ui/commit/b12dcebdb0167fd5852c247bca48844ef6ab35af))
* refactor metrics storage section ([#568](https://github.com/ydb-platform/ydb-embedded-ui/issues/568)) ([db5d922](https://github.com/ydb-platform/ydb-embedded-ui/commit/db5d922d06b88c9d8a792220d2a178c81806c09e))
* update @types/react ([#570](https://github.com/ydb-platform/ydb-embedded-ui/issues/570)) ([1e38c5b](https://github.com/ydb-platform/ydb-embedded-ui/commit/1e38c5bb3b4b2139b2141636d6434c2a2ec65772))

## [4.20.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.19.3...v4.20.0) (2023-10-19)


### Features

* add top nodes by memory table ([#562](https://github.com/ydb-platform/ydb-embedded-ui/issues/562)) ([0d4ccf2](https://github.com/ydb-platform/ydb-embedded-ui/commit/0d4ccf2a85251fadad66182ab7d6ccd54a58e6cf))
* add top tables links ([#564](https://github.com/ydb-platform/ydb-embedded-ui/issues/564)) ([e9b918f](https://github.com/ydb-platform/ydb-embedded-ui/commit/e9b918f0abace890cfafd9d7b219be5b69cac820))
* **Storage:** hide nodes table for node page ([#557](https://github.com/ydb-platform/ydb-embedded-ui/issues/557)) ([9a25a00](https://github.com/ydb-platform/ydb-embedded-ui/commit/9a25a002b28824f7e616ac8143dbde12de0b0fb7))
* **TenantOverview:** add cpu tab to tenant diagnostics ([#550](https://github.com/ydb-platform/ydb-embedded-ui/issues/550)) ([3048f84](https://github.com/ydb-platform/ydb-embedded-ui/commit/3048f8478d97249da4f7b66c26ed55f6f21e0f81))


### Bug Fixes

* add loader for healthcheck ([#563](https://github.com/ydb-platform/ydb-embedded-ui/issues/563)) ([6caea3d](https://github.com/ydb-platform/ydb-embedded-ui/commit/6caea3dec8f901090b0f8f7c1796880d7dc90a99))
* **LinkToSchemaObject:** fix schema link ([#566](https://github.com/ydb-platform/ydb-embedded-ui/issues/566)) ([6ca8a70](https://github.com/ydb-platform/ydb-embedded-ui/commit/6ca8a705b6ddacb1f845aabb7761fd22c0c3b4e0))

## [4.19.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.19.2...v4.19.3) (2023-10-13)


### Bug Fixes

* fix ProgressViewer background ([#556](https://github.com/ydb-platform/ydb-embedded-ui/issues/556)) ([6234462](https://github.com/ydb-platform/ydb-embedded-ui/commit/62344629713059fdfb191d3b8a57742f864dad66))
* **Storage:** display all groups by default ([#554](https://github.com/ydb-platform/ydb-embedded-ui/issues/554)) ([1da83f1](https://github.com/ydb-platform/ydb-embedded-ui/commit/1da83f19661ed8e49dd7c8a0930ce89a7c8c0185))

## [4.19.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.19.1...v4.19.2) (2023-10-12)


### Bug Fixes

* add default data formatter to ProgressViewer ([#552](https://github.com/ydb-platform/ydb-embedded-ui/issues/552)) ([ac372a4](https://github.com/ydb-platform/ydb-embedded-ui/commit/ac372a415e67e7126518d9c5a8d04594b82cf485))
* **Tenant:** fix tree not fully collapsed bug ([#551](https://github.com/ydb-platform/ydb-embedded-ui/issues/551)) ([8469307](https://github.com/ydb-platform/ydb-embedded-ui/commit/8469307b67d463ed2aafd17b2c0319ea40c1f8d5))

## [4.19.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.19.0...v4.19.1) (2023-10-11)


### Bug Fixes

* add storage value to tb formatter ([#547](https://github.com/ydb-platform/ydb-embedded-ui/issues/547)) ([f1e4377](https://github.com/ydb-platform/ydb-embedded-ui/commit/f1e4377443be493a7072aca33a62b51e381f6841))

## [4.19.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.18.0...v4.19.0) (2023-10-11)


### Features

* **TenantOverview:** add storage tab to tenant diagnostics ([#541](https://github.com/ydb-platform/ydb-embedded-ui/issues/541)) ([c4cdd35](https://github.com/ydb-platform/ydb-embedded-ui/commit/c4cdd354cd9780dfd7dfee80ec225f59d4230625))


### Bug Fixes

* add NodeId to NodeAddress type ([#545](https://github.com/ydb-platform/ydb-embedded-ui/issues/545)) ([3df82d3](https://github.com/ydb-platform/ydb-embedded-ui/commit/3df82d39466696ec61e34b915b355dacd0482ebc))
* display database name in node info ([#543](https://github.com/ydb-platform/ydb-embedded-ui/issues/543)) ([788ad9a](https://github.com/ydb-platform/ydb-embedded-ui/commit/788ad9a7a1a56ffe93ec7e4861ded6cceef72d9c))
* fix cpu usage calculation ([#542](https://github.com/ydb-platform/ydb-embedded-ui/issues/542)) ([f46b03d](https://github.com/ydb-platform/ydb-embedded-ui/commit/f46b03d6157f19017560d71a9ab6591f045bad96))
* fix incorrect data display in ProgressViewer ([#546](https://github.com/ydb-platform/ydb-embedded-ui/issues/546)) ([be077b8](https://github.com/ydb-platform/ydb-embedded-ui/commit/be077b83a4b4cf083d506e77abf0f2b6570c87d3))

## [4.18.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.17.0...v4.18.0) (2023-09-25)


### Features

* **ProgressViewer:** add custom threasholds to ProgressViewer ([#540](https://github.com/ydb-platform/ydb-embedded-ui/issues/540)) ([3553065](https://github.com/ydb-platform/ydb-embedded-ui/commit/35530655581357f4a79c277a5bf9846b3befb784))


### Bug Fixes

* **Authentication:** enable page redirect ([#539](https://github.com/ydb-platform/ydb-embedded-ui/issues/539)) ([721883c](https://github.com/ydb-platform/ydb-embedded-ui/commit/721883cc7f4ca60e64d4a5f77b939dbb8e960855))
* **Healthcheck:** add merge_records request param ([#538](https://github.com/ydb-platform/ydb-embedded-ui/issues/538)) ([6a47481](https://github.com/ydb-platform/ydb-embedded-ui/commit/6a474814f71c3318715a8ce638fd522a770d8038))
* **Nodes:** use nodes endpoint by default ([#535](https://github.com/ydb-platform/ydb-embedded-ui/issues/535)) ([12d4fef](https://github.com/ydb-platform/ydb-embedded-ui/commit/12d4fefde7a6663bb1a11f46b4e94fb24b23e966))
* rename flag for display metrics cards for database diagnostics ([#536](https://github.com/ydb-platform/ydb-embedded-ui/issues/536)) ([957e1fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/957e1fafbbc43928498ae9e8d0bc119bcda5288d))

## [4.17.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.16.2...v4.17.0) (2023-09-18)


### Features

* add sorting of issues in issues tree ([#532](https://github.com/ydb-platform/ydb-embedded-ui/issues/532)) ([9f7837c](https://github.com/ydb-platform/ydb-embedded-ui/commit/9f7837c95bd1132dd287011e1aadc96c0819b40d))
* move healthcheck to tabs ([#531](https://github.com/ydb-platform/ydb-embedded-ui/issues/531)) ([1879d3d](https://github.com/ydb-platform/ydb-embedded-ui/commit/1879d3d8f717a0baaec0d506ad354d81a226fa62))
* update TenantOverview design ([#527](https://github.com/ydb-platform/ydb-embedded-ui/issues/527)) ([8a752e0](https://github.com/ydb-platform/ydb-embedded-ui/commit/8a752e0def3dc4317fd18519aed210bdc23fefa2))


### Bug Fixes

* fix Healthcheck blinking ([#528](https://github.com/ydb-platform/ydb-embedded-ui/issues/528)) ([0fc6c46](https://github.com/ydb-platform/ydb-embedded-ui/commit/0fc6c46eb15aeb73a984ba2c2cbe18ef7116382e))
* **Tenants:** use blob storage ([#530](https://github.com/ydb-platform/ydb-embedded-ui/issues/530)) ([8a546a1](https://github.com/ydb-platform/ydb-embedded-ui/commit/8a546a1ab2f812acc1523c1c35738f4c605c32a5))

## [4.16.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.16.1...v4.16.2) (2023-08-28)


### Bug Fixes

* fix topic templates ([#524](https://github.com/ydb-platform/ydb-embedded-ui/issues/524)) ([f593b57](https://github.com/ydb-platform/ydb-embedded-ui/commit/f593b575fb64d0c69b56e743fd4cd6faba1e9d0e))
* rename additionalInfo params to additionalProps ([#525](https://github.com/ydb-platform/ydb-embedded-ui/issues/525)) ([dd2b040](https://github.com/ydb-platform/ydb-embedded-ui/commit/dd2b04039cd80072fe11744f3490c176fe21b16b))

## [4.16.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.16.0...v4.16.1) (2023-08-25)


### Bug Fixes

* fix types for external props ([#522](https://github.com/ydb-platform/ydb-embedded-ui/issues/522)) ([173081f](https://github.com/ydb-platform/ydb-embedded-ui/commit/173081f2f0d2814b2311757988d91fbffc2a509f))

## [4.16.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.15.1...v4.16.0) (2023-08-25)


### Features

* add language setting ([#520](https://github.com/ydb-platform/ydb-embedded-ui/issues/520)) ([425c9ae](https://github.com/ydb-platform/ydb-embedded-ui/commit/425c9ae1fed83d7695d2a9288c2ef24c2807d8da))
* **Diagnostics:** update Healthcheck design ([#509](https://github.com/ydb-platform/ydb-embedded-ui/issues/509)) ([e315ca4](https://github.com/ydb-platform/ydb-embedded-ui/commit/e315ca42ac6c9d1736aaa25e2dd90afc2bcb9a8e))
* **Query:** support PostgreSQL syntax ([#515](https://github.com/ydb-platform/ydb-embedded-ui/issues/515)) ([0c8346e](https://github.com/ydb-platform/ydb-embedded-ui/commit/0c8346efc3643a8d201137901880f985dc100458))


### Bug Fixes

* **UserSettings:** update query mode setting description ([#521](https://github.com/ydb-platform/ydb-embedded-ui/issues/521)) ([c526471](https://github.com/ydb-platform/ydb-embedded-ui/commit/c52647192ff95d8fb9961479a85cc4d5a639d4e6))

## [4.15.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.15.0...v4.15.1) (2023-08-21)


### Bug Fixes

* **SchemaTree:** update create table template ([#512](https://github.com/ydb-platform/ydb-embedded-ui/issues/512)) ([712b3f3](https://github.com/ydb-platform/ydb-embedded-ui/commit/712b3f3612b09fdc5c850ffc3a984cd86827e5b9))

## [4.15.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.14.0...v4.15.0) (2023-08-17)


### Features

* **SchemaTree:** add actions for topic ([#507](https://github.com/ydb-platform/ydb-embedded-ui/issues/507)) ([6700136](https://github.com/ydb-platform/ydb-embedded-ui/commit/670013629cb68425e670969323a2ef466ef7c018))
* **Storage:** sort on backend ([#510](https://github.com/ydb-platform/ydb-embedded-ui/issues/510)) ([034a89a](https://github.com/ydb-platform/ydb-embedded-ui/commit/034a89a9844021c5ea3a73c8f6456e35128078c0))
* **Storage:** v2 api and backend filters ([#506](https://github.com/ydb-platform/ydb-embedded-ui/issues/506)) ([ce4bf6d](https://github.com/ydb-platform/ydb-embedded-ui/commit/ce4bf6d0ef154b87a7b3a44d56281230b2b5b554))

## [4.14.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.13.0...v4.14.0) (2023-08-11)


### Features

* **Nodes:** filter and sort on backend ([#503](https://github.com/ydb-platform/ydb-embedded-ui/issues/503)) ([2e8ab8e](https://github.com/ydb-platform/ydb-embedded-ui/commit/2e8ab8e9965db61ec281f7340b89dd3967b639df))
* **Query:** add explanation to query duration ([#501](https://github.com/ydb-platform/ydb-embedded-ui/issues/501)) ([a5f5140](https://github.com/ydb-platform/ydb-embedded-ui/commit/a5f5140a23864147d8495e3c6b94709e5e710a9b))


### Bug Fixes

* **Header:** add icons for nodes and tablets ([#500](https://github.com/ydb-platform/ydb-embedded-ui/issues/500)) ([862660c](https://github.com/ydb-platform/ydb-embedded-ui/commit/862660c1928c2c2b626e4417cd043f0bd5a65df9))
* **Query:** fix query method selector help text ([#504](https://github.com/ydb-platform/ydb-embedded-ui/issues/504)) ([65cdf9e](https://github.com/ydb-platform/ydb-embedded-ui/commit/65cdf9ee93277c193cc1ad036b2cb38d2ae15b71))
* **Query:** transfer API calls to a new line ([#499](https://github.com/ydb-platform/ydb-embedded-ui/issues/499)) ([de3d540](https://github.com/ydb-platform/ydb-embedded-ui/commit/de3d5404310f32ba05598bb99a1afb1b65ab45a1))
* **SchemaTree:** transfer Show Preview to SchemaTree ([#505](https://github.com/ydb-platform/ydb-embedded-ui/issues/505)) ([46220c4](https://github.com/ydb-platform/ydb-embedded-ui/commit/46220c4b2cd111acf12712b4693744c52aaf7231))

## [4.13.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.12.0...v4.13.0) (2023-08-04)


### Features

* info and summary tabs for external objects ([#493](https://github.com/ydb-platform/ydb-embedded-ui/issues/493)) ([88d9041](https://github.com/ydb-platform/ydb-embedded-ui/commit/88d9041f080f13046aeaf55765609dbc13b87285))


### Bug Fixes

* **SchemaTree:** add actions to external objects ([#497](https://github.com/ydb-platform/ydb-embedded-ui/issues/497)) ([5029579](https://github.com/ydb-platform/ydb-embedded-ui/commit/5029579796dd5fb985005f39e9ef8daf142366d0))
* **SchemaTree:** set required query mode for tree actions ([#491](https://github.com/ydb-platform/ydb-embedded-ui/issues/491)) ([ccd1eda](https://github.com/ydb-platform/ydb-embedded-ui/commit/ccd1edac0d84357cd605c9d131c99890449d8bd8))

## [4.12.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.11.1...v4.12.0) (2023-08-02)


### Features

* **Query:** add explanation to the query method selector ([#492](https://github.com/ydb-platform/ydb-embedded-ui/issues/492)) ([ce6407c](https://github.com/ydb-platform/ydb-embedded-ui/commit/ce6407c254e9498d5b3bce60298905ea72621766))


### Bug Fixes

* fix tablet size ([#490](https://github.com/ydb-platform/ydb-embedded-ui/issues/490)) ([5a9b9d9](https://github.com/ydb-platform/ydb-embedded-ui/commit/5a9b9d955a882b1191502f5bac8eff5cf8638a52))
* **Search:** add minimum width to Search ([#494](https://github.com/ydb-platform/ydb-embedded-ui/issues/494)) ([2add1dc](https://github.com/ydb-platform/ydb-embedded-ui/commit/2add1dcb3c8a76297ab35600e6d8a8772a411b1d))

## [4.11.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.11.0...v4.11.1) (2023-07-27)


### Bug Fixes

* **Issues:** fix types ([#488](https://github.com/ydb-platform/ydb-embedded-ui/issues/488)) ([e2fe731](https://github.com/ydb-platform/ydb-embedded-ui/commit/e2fe731ae23db6703f21179668582d5657de9550))

## [4.11.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.10.1...v4.11.0) (2023-07-27)


### Features

* support external objects in schema tree ([#485](https://github.com/ydb-platform/ydb-embedded-ui/issues/485)) ([cf96f9a](https://github.com/ydb-platform/ydb-embedded-ui/commit/cf96f9af02db1352f3990f21f8a84c1282229517))


### Bug Fixes

* **ClusterInfo:** change cluster default name ([#478](https://github.com/ydb-platform/ydb-embedded-ui/issues/478)) ([398df6e](https://github.com/ydb-platform/ydb-embedded-ui/commit/398df6e3a5778c245653f61b41ba2e1bd0ea3a51))
* fix copy schema action ([#483](https://github.com/ydb-platform/ydb-embedded-ui/issues/483)) ([f6b01c3](https://github.com/ydb-platform/ydb-embedded-ui/commit/f6b01c3cc2808337d5597f990f65ff3e7c010b05))
* **Nodes:** support v2 compute ([#476](https://github.com/ydb-platform/ydb-embedded-ui/issues/476)) ([696d43a](https://github.com/ydb-platform/ydb-embedded-ui/commit/696d43a04109c7fc68986e036e66767593af8d00))
* **ObjectSummary:** fix issue on object change with active schema tab ([#482](https://github.com/ydb-platform/ydb-embedded-ui/issues/482)) ([b50db5f](https://github.com/ydb-platform/ydb-embedded-ui/commit/b50db5ff742c5c7fc27e292309831b937e5d40bd))
* **ObjectSummary:** fix wrong tree alignment bug ([#486](https://github.com/ydb-platform/ydb-embedded-ui/issues/486)) ([e8bfe99](https://github.com/ydb-platform/ydb-embedded-ui/commit/e8bfe99657870c735a41d24febaa907ac1383479))
* **Query:** process null issues error ([#480](https://github.com/ydb-platform/ydb-embedded-ui/issues/480)) ([4c4e684](https://github.com/ydb-platform/ydb-embedded-ui/commit/4c4e6845e539296ecbdefa930bc63d3321f277dc))

## [4.10.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.10.0...v4.10.1) (2023-07-14)


### Bug Fixes

* apply design fixes ([#475](https://github.com/ydb-platform/ydb-embedded-ui/issues/475)) ([5e7c9ca](https://github.com/ydb-platform/ydb-embedded-ui/commit/5e7c9caa9f54094a3eb6448d92d43242d3e738dd))
* **AsideNavigation:** replace query icon ([#466](https://github.com/ydb-platform/ydb-embedded-ui/issues/466)) ([4495eb2](https://github.com/ydb-platform/ydb-embedded-ui/commit/4495eb2634e48feda677c03591b92393ad28981e))
* **ClusterInfo:** add Databases field ([#474](https://github.com/ydb-platform/ydb-embedded-ui/issues/474)) ([28a9936](https://github.com/ydb-platform/ydb-embedded-ui/commit/28a99364bf5e916381a54a59d4d3f979b35f6eff))
* **Cluster:** make global scroll ([#470](https://github.com/ydb-platform/ydb-embedded-ui/issues/470)) ([30f8bc5](https://github.com/ydb-platform/ydb-embedded-ui/commit/30f8bc5ce52fceda076d278b1464d413e899ae21))
* **Cluster:** remove tabs icons and numbers ([#473](https://github.com/ydb-platform/ydb-embedded-ui/issues/473)) ([d2e43d4](https://github.com/ydb-platform/ydb-embedded-ui/commit/d2e43d41759b085f34b7f29f52f3aba60cd0588f))
* **Query:** rename New Query tab to Query ([#467](https://github.com/ydb-platform/ydb-embedded-ui/issues/467)) ([c3f5585](https://github.com/ydb-platform/ydb-embedded-ui/commit/c3f5585562a204ef0831d0c45766b17c3dc72f82))
* **TableIndexInfo:** format DataSize ([#468](https://github.com/ydb-platform/ydb-embedded-ui/issues/468)) ([a189b8c](https://github.com/ydb-platform/ydb-embedded-ui/commit/a189b8cf9610f6b1b7b5f4c01896eda5f8347ebf))

## [4.10.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.9.0...v4.10.0) (2023-07-07)


### Bug Fixes

* **AsideNavigation:** swap icons ([#465](https://github.com/ydb-platform/ydb-embedded-ui/issues/465)) ([13bc92a](https://github.com/ydb-platform/ydb-embedded-ui/commit/13bc92a0150ee8d809b3811b528f5d31f4999815))
* move sendQuery timeout to request query ([#464](https://github.com/ydb-platform/ydb-embedded-ui/issues/464)) ([6323038](https://github.com/ydb-platform/ydb-embedded-ui/commit/6323038b9e327a9e348812b43514008e9d07640c))
* **QueryEditor:** do not reset input on empty savedPath ([#451](https://github.com/ydb-platform/ydb-embedded-ui/issues/451)) ([7f98e44](https://github.com/ydb-platform/ydb-embedded-ui/commit/7f98e44834b54bfc1398bb418909fae21e22a3dc))
* show 5 digits size in table info ([#461](https://github.com/ydb-platform/ydb-embedded-ui/issues/461)) ([8c4ecc4](https://github.com/ydb-platform/ydb-embedded-ui/commit/8c4ecc41ed41cad34debaa6ff7f39f1f10f8d974))
* **TenantOverview:** add copy button to tenant name ([#459](https://github.com/ydb-platform/ydb-embedded-ui/issues/459)) ([2d8b380](https://github.com/ydb-platform/ydb-embedded-ui/commit/2d8b38049a038fb889e82d0135c026462107a124))
* **UsageFilter:** fix bar flashes ([#457](https://github.com/ydb-platform/ydb-embedded-ui/issues/457)) ([ae1965e](https://github.com/ydb-platform/ydb-embedded-ui/commit/ae1965ec894c7d012f0ebfc5949b73d4499b390e))

## [4.9.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.8.2...v4.9.0) (2023-06-30)


### Features

* **QueryEditor:** remove old controls, update setting ([#445](https://github.com/ydb-platform/ydb-embedded-ui/issues/445)) ([75efd44](https://github.com/ydb-platform/ydb-embedded-ui/commit/75efd444c8b8ba5213117ec9c33f6b9664855a2c))


### Bug Fixes

* **QueryEditor:** color last used query action, run on command ([#436](https://github.com/ydb-platform/ydb-embedded-ui/issues/436)) ([c4d3bb8](https://github.com/ydb-platform/ydb-embedded-ui/commit/c4d3bb81bc1cea8ec3fe2e5e7e18c997d94f5714))
* **QueryEditor:** rename query modes ([#449](https://github.com/ydb-platform/ydb-embedded-ui/issues/449)) ([c93c9c1](https://github.com/ydb-platform/ydb-embedded-ui/commit/c93c9c17ba26e01c596009657cac02ecc9cc9ab0))
* **StorageNodes:** sort by uptime ([#447](https://github.com/ydb-platform/ydb-embedded-ui/issues/447)) ([283cb81](https://github.com/ydb-platform/ydb-embedded-ui/commit/283cb81b3f4711ddc2bb991615729a9bda7e893c))
* **Storage:** remove visible entities filter ([#448](https://github.com/ydb-platform/ydb-embedded-ui/issues/448)) ([b4d9489](https://github.com/ydb-platform/ydb-embedded-ui/commit/b4d948965cd349a54fe833a6b81ea3b087782735))

## [4.8.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.8.1...v4.8.2) (2023-06-27)


### Bug Fixes

* **breadcrumbs:** update tenant and tablet params ([#443](https://github.com/ydb-platform/ydb-embedded-ui/issues/443)) ([b0d31ac](https://github.com/ydb-platform/ydb-embedded-ui/commit/b0d31acce6d6e97d759180c885e6aea3b762a91c))

## [4.8.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.8.0...v4.8.1) (2023-06-26)


### Bug Fixes

* **Tenants:** fix tenant link ([#439](https://github.com/ydb-platform/ydb-embedded-ui/issues/439)) ([432c621](https://github.com/ydb-platform/ydb-embedded-ui/commit/432c621eb2fb2ffd5a747299af930236d5cc06f7))

## [4.8.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.7.0...v4.8.0) (2023-06-26)


### Features

* **Tenant:** transform general tabs into left navigation items ([#431](https://github.com/ydb-platform/ydb-embedded-ui/issues/431)) ([7117b96](https://github.com/ydb-platform/ydb-embedded-ui/commit/7117b9622d5f6469dcc2bcc1c0d5cb71d4f94c0b))

## [4.7.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.6.0...v4.7.0) (2023-06-23)


### Features

* **QueryEditor:** transform history and saved to tabs ([#427](https://github.com/ydb-platform/ydb-embedded-ui/issues/427)) ([6378ca7](https://github.com/ydb-platform/ydb-embedded-ui/commit/6378ca7013239b33e55c1f88fdde7cab3a102df6))
* update breadcrumbs ([#432](https://github.com/ydb-platform/ydb-embedded-ui/issues/432)) ([e583a03](https://github.com/ydb-platform/ydb-embedded-ui/commit/e583a03fe0d77698f29c924e611133f015c3f7ad))


### Bug Fixes

* **Cluster:** add icons to tabs ([#430](https://github.com/ydb-platform/ydb-embedded-ui/issues/430)) ([e9e649f](https://github.com/ydb-platform/ydb-embedded-ui/commit/e9e649f614691e44172c9b93dd3119066c145413))
* **ClusterInfo:** hide by default ([#435](https://github.com/ydb-platform/ydb-embedded-ui/issues/435)) ([ef2b353](https://github.com/ydb-platform/ydb-embedded-ui/commit/ef2b3535f2c6324a34c4386680f5050655a04eb4))
* **Cluster:** use counter from uikit for tabs ([#428](https://github.com/ydb-platform/ydb-embedded-ui/issues/428)) ([19ca3bd](https://github.com/ydb-platform/ydb-embedded-ui/commit/19ca3bd14b15bdab1a9621939ddceee6d23b08ac))
* **DetailedOverview:** prevent tenant info scroll on overflow ([#434](https://github.com/ydb-platform/ydb-embedded-ui/issues/434)) ([8ed6076](https://github.com/ydb-platform/ydb-embedded-ui/commit/8ed60760d54913d05f39d35d00a34c8b1d7d9738))
* rename Internal Viewer to Developer UI ([#423](https://github.com/ydb-platform/ydb-embedded-ui/issues/423)) ([3eb21f3](https://github.com/ydb-platform/ydb-embedded-ui/commit/3eb21f35a230cc591f02ef9b195f99031f832e8a))
* **Storage:** update columns ([#437](https://github.com/ydb-platform/ydb-embedded-ui/issues/437)) ([264fbc9](https://github.com/ydb-platform/ydb-embedded-ui/commit/264fbc984cd9ef1467110d3e2f5ed9b29a526c2b))
* **Tablet:** clear tablet data on unmount ([#425](https://github.com/ydb-platform/ydb-embedded-ui/issues/425)) ([5d308cd](https://github.com/ydb-platform/ydb-embedded-ui/commit/5d308cdded342d7a40cbc6a91431d3f286c39b8a))
* **TabletsStatistic:** use tenant backend ([#429](https://github.com/ydb-platform/ydb-embedded-ui/issues/429)) ([d290684](https://github.com/ydb-platform/ydb-embedded-ui/commit/d290684ba08aec8b66c0492ba571a5337b5b896c))

## [4.6.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.5.2...v4.6.0) (2023-06-13)


### Features

* **QueryEditor:** add data and query modes ([#422](https://github.com/ydb-platform/ydb-embedded-ui/issues/422)) ([c142f03](https://github.com/ydb-platform/ydb-embedded-ui/commit/c142f03e9caeab4dcf1d34b3988e949a94213932))
* rework navigation, update breadcrumbs ([#418](https://github.com/ydb-platform/ydb-embedded-ui/issues/418)) ([2d807d6](https://github.com/ydb-platform/ydb-embedded-ui/commit/2d807d6a52e13edcf2a7e1591672224339d91949))


### Bug Fixes

* **Diagnostics:** remove unneded tenantInfo fetch ([#420](https://github.com/ydb-platform/ydb-embedded-ui/issues/420)) ([ccaafe4](https://github.com/ydb-platform/ydb-embedded-ui/commit/ccaafe4ec9346ee1ec2ebd2a62600274f2175bfb))

## [4.5.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.5.1...v4.5.2) (2023-06-06)


### Bug Fixes

* **Versions:** enable table dynamic render ([#416](https://github.com/ydb-platform/ydb-embedded-ui/issues/416)) ([3c877ea](https://github.com/ydb-platform/ydb-embedded-ui/commit/3c877ea88a0c4036213b38099676f473cf3ac2d6))

## [4.5.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.5.0...v4.5.1) (2023-06-02)


### Bug Fixes

* **Tablet:** fetch data on action finish ([#405](https://github.com/ydb-platform/ydb-embedded-ui/issues/405)) ([f1d71c5](https://github.com/ydb-platform/ydb-embedded-ui/commit/f1d71c5af330a0a13246f8d87433e6bba1d3509a))

## [4.5.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.4.2...v4.5.0) (2023-06-01)


### Features

* **ClusterInfo:** update versions bar, rework DC and Tablets fields ([#407](https://github.com/ydb-platform/ydb-embedded-ui/issues/407)) ([4824f0d](https://github.com/ydb-platform/ydb-embedded-ui/commit/4824f0d2be9d7bec3641302c88b39a3a87f37c18))

## [4.4.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.4.1...v4.4.2) (2023-05-29)


### Bug Fixes

* **Partitions:** fix offsets calculation ([#402](https://github.com/ydb-platform/ydb-embedded-ui/issues/402)) ([fd4741f](https://github.com/ydb-platform/ydb-embedded-ui/commit/fd4741f8761aa6aa9ec31681522c4d261a83273f))

## [4.4.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.4.0...v4.4.1) (2023-05-25)


### Bug Fixes

* **Nodes:** fix endpoint setting ([#397](https://github.com/ydb-platform/ydb-embedded-ui/issues/397)) ([4aea8a2](https://github.com/ydb-platform/ydb-embedded-ui/commit/4aea8a2597909338e31ac51577989a4d82ec93cf))

## [4.4.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.3.0...v4.4.0) (2023-05-25)


### Features

* add Versions ([#394](https://github.com/ydb-platform/ydb-embedded-ui/issues/394)) ([d5abb58](https://github.com/ydb-platform/ydb-embedded-ui/commit/d5abb586a127135c5756a3aa5076060c0dce3fba))
* remove unsupported pages ([b2bc3b2](https://github.com/ydb-platform/ydb-embedded-ui/commit/b2bc3b22029679769bb0de73f2c33827028de8a8))


### Bug Fixes

* **ClusterInfo:** do not show response error on cancelled requests ([83501b5](https://github.com/ydb-platform/ydb-embedded-ui/commit/83501b50f0c266ba654858767ca89a2a3fa891ed))
* **Cluster:** remove padding from cluster page ([8138823](https://github.com/ydb-platform/ydb-embedded-ui/commit/8138823a9d5d3dbd1f086fb0bb23265d7faa8025))
* **Partitions:** fix columns titles ([4fe21a0](https://github.com/ydb-platform/ydb-embedded-ui/commit/4fe21a0dc149c7bca0611c74990756fbdc5fb273))
* **Partitions:** update Select empty value ([a7df6d1](https://github.com/ydb-platform/ydb-embedded-ui/commit/a7df6d1c86224a4534fac048cebc61b6f5a78fde))
* **UserSettings:** separate Setting, enable additional settings ([#396](https://github.com/ydb-platform/ydb-embedded-ui/issues/396)) ([e8a17a1](https://github.com/ydb-platform/ydb-embedded-ui/commit/e8a17a160c82212a181b1ef4e3b9f223db29907e))

## [4.3.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.2.1...v4.3.0) (2023-05-18)


### Features

* **Partitions:** display partitions for topic without consumers ([0843a49](https://github.com/ydb-platform/ydb-embedded-ui/commit/0843a49c46cb6765b376832a847c3ac0ce8b6b85))


### Bug Fixes

* **Tablet:** update state to color mapping ([7ccc8c7](https://github.com/ydb-platform/ydb-embedded-ui/commit/7ccc8c79225cd311a7a3674150335b58a94f293e))

## [4.2.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.2.0...v4.2.1) (2023-05-18)


### Bug Fixes

* export toaster ([b5d12c0](https://github.com/ydb-platform/ydb-embedded-ui/commit/b5d12c0aa39ea3877a9b74071e3124f89a309ca3))

## [4.2.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.1.0...v4.2.0) (2023-05-16)


### Features

* **Tablet:** display node fqdn in table ([4d8099a](https://github.com/ydb-platform/ydb-embedded-ui/commit/4d8099a454f34fc76886b26ca948895171c57ab8))


### Bug Fixes

* **api:** change nulls to empty objects ([0ab14e8](https://github.com/ydb-platform/ydb-embedded-ui/commit/0ab14e883a47aeac2f2bab437f2214a32ccb1c9b))
* display storage pool in VDisks popups ([5b5dd8a](https://github.com/ydb-platform/ydb-embedded-ui/commit/5b5dd8a4e6cb4bcc1ead78a7c06d2e80a81424cc))
* fix Select label and values align ([f796730](https://github.com/ydb-platform/ydb-embedded-ui/commit/f7967309fe4a042e7637de212f33b1ebfc6877fc))
* **Overview:** partitioning by size disabled for 0 SizeToSpit ([1028e7d](https://github.com/ydb-platform/ydb-embedded-ui/commit/1028e7d8d3566f5f5e6b2ebe04112ef135d7b55e))
* **Schema:** display NotNull columns ([d61eaa4](https://github.com/ydb-platform/ydb-embedded-ui/commit/d61eaa4ccff357c1e9ca6efde855ec46be24a314))

## [4.1.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v4.0.0...v4.1.0) (2023-05-10)


### Features

* **Navigation:** remove legacy navigation setting support ([8544f11](https://github.com/ydb-platform/ydb-embedded-ui/commit/8544f114255ba44834d38cd9e709450c49e4a96a))


### Bug Fixes

* disable link and popover for unavailable nodes ([990a9fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/990a9fa42a7133a6c40d07e11c3518240e18b4a9))

## [4.0.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.5.0...v4.0.0) (2023-04-28)


### ⚠ BREAKING CHANGES

* app no longer parses query responses from older ydb versions
* v0.1 explain plans are no longer rendered

### Features

* enable explain-script parsing, remove deprecated code ([5c6e9a2](https://github.com/ydb-platform/ydb-embedded-ui/commit/5c6e9a21026ea9eb3e32650e6fdda89c7900e7e6))
* **QueryEditor:** add explain query modes ([39ad943](https://github.com/ydb-platform/ydb-embedded-ui/commit/39ad9434c1622e22901e6cc1af1568e0edf6b434))
* **QueryEditor:** display query duration ([967f102](https://github.com/ydb-platform/ydb-embedded-ui/commit/967f10296d2362709654172ed7318509286efc78))
* remove support for explain v0.1 ([c8741a6](https://github.com/ydb-platform/ydb-embedded-ui/commit/c8741a69b82053185a07c7ba563455d4f28ecdce))


### Bug Fixes

* **query:** correctly process NetworkError on actions failure ([cf5bd6c](https://github.com/ydb-platform/ydb-embedded-ui/commit/cf5bd6c5c4c2972fec93b2dc9135c92c639fa5f9))
* **QueryExplain:** do not request ast when missing ([54cf151](https://github.com/ydb-platform/ydb-embedded-ui/commit/54cf151452e17256173736450f5727085ea591ff))
* **QueryExplain:** request AST if it is empty ([d028b4e](https://github.com/ydb-platform/ydb-embedded-ui/commit/d028b4ed08a98281baff81683204f1cbc1c20c37))

## [3.5.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.4.5...v3.5.0) (2023-04-18)


### Features

* **TableInfo:** extend Table and ColumnTable info ([89e54aa](https://github.com/ydb-platform/ydb-embedded-ui/commit/89e54aa97d7bcbabfd5100daeb1dc0c03608e86e))
* **TopQueries:** add columns ([b49b98d](https://github.com/ydb-platform/ydb-embedded-ui/commit/b49b98db2da08c355b23f4a33bf05247530543db))


### Bug Fixes

* **settings:** use system theme by default ([726c9cb](https://github.com/ydb-platform/ydb-embedded-ui/commit/726c9cb14d7f87cc9248340d1ebebfc8bf0d0384))
* **Storage:** fix incorrect usage on zero available space ([2704cd7](https://github.com/ydb-platform/ydb-embedded-ui/commit/2704cd7c696d337cc8e3af68941cf444f8dfae81))
* **TableInfo:** add default format for FollowerGroup fields ([961334a](https://github.com/ydb-platform/ydb-embedded-ui/commit/961334aabe89672994f0f3440e20602e180b3394))
* **Tablet:** fix dialog type enum ([c477042](https://github.com/ydb-platform/ydb-embedded-ui/commit/c477042cacc2e777cae4bd6981381a8042c603ed))
* **TopQueries:** enable go back to TopQueries from Query tab ([bbdfe72](https://github.com/ydb-platform/ydb-embedded-ui/commit/bbdfe726c9081f01422dca787b83399ea44b3956))
* **TopShards:** fix table crash on undefined values ([604e99a](https://github.com/ydb-platform/ydb-embedded-ui/commit/604e99a9427021c61ceb8ea366e316e629032b84))
* **TruncatedQuery:** wrap message ([f41b7ff](https://github.com/ydb-platform/ydb-embedded-ui/commit/f41b7ff33ac0145446ca89aab031036247f3ddf8))

## [3.4.5](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.4.4...v3.4.5) (2023-03-30)


### Bug Fixes

* **Consumers:** fix typo ([aaa9dbd](https://github.com/ydb-platform/ydb-embedded-ui/commit/aaa9dbda1f28702917793a61bae2813f6ef018bb))
* **PDisk:** add display block to content ([130dab2](https://github.com/ydb-platform/ydb-embedded-ui/commit/130dab20ffdc9da77225c94a6e6064f0308a1c2a))
* **Storage:** get nodes hosts from /nodelist ([cc82dd9](https://github.com/ydb-platform/ydb-embedded-ui/commit/cc82dd93808133b0d1dcd21b31ee3744df4f7383))
* **StorageNodes:** make fqdn similar to nodes page ([344298a](https://github.com/ydb-platform/ydb-embedded-ui/commit/344298a9a29380f1068b002fa304cdcc221ce0d4))
* **TopicInfo:** do not display /s when speed is undefined ([2d41832](https://github.com/ydb-platform/ydb-embedded-ui/commit/2d4183247ec33acdfa45be72a93f0dbd93b716e0))
* **TopicStats:** use prepared stats, update fields ([a614a8c](https://github.com/ydb-platform/ydb-embedded-ui/commit/a614a8caa2744b844d97f23f25e5385387367d6b))

## [3.4.4](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.4.3...v3.4.4) (2023-03-22)


### Bug Fixes

* **Diagnostics:** display nodes tab for not db entities ([a542dbc](https://github.com/ydb-platform/ydb-embedded-ui/commit/a542dbc23d01138a5c1a4126cfc1836a1543b68c))

## [3.4.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.4.2...v3.4.3) (2023-03-17)


### Bug Fixes

* add opacity to unavailable nodes ([8b82c78](https://github.com/ydb-platform/ydb-embedded-ui/commit/8b82c78f0b6bed536ca23c63b78b141b29afc4a8))
* **Tablet:** add error check ([49f13cf](https://github.com/ydb-platform/ydb-embedded-ui/commit/49f13cf0cff2d6dad59b8f6a4c2885966bf3450a))
* **VDisk:** fix typo ([1528d03](https://github.com/ydb-platform/ydb-embedded-ui/commit/1528d03531f482e438e0bdb6c761be236822fc27))

## [3.4.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.4.1...v3.4.2) (2023-03-03)


### Bug Fixes

* **Partitions:** add search to consumers filter ([95e4462](https://github.com/ydb-platform/ydb-embedded-ui/commit/95e446295cb2b2729daf0d0ef719e37c7c8e0d3c))
* **Partitions:** fix error on wrong consumer in query string ([44269fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/44269fa9240fe31c9ef69e061c20d58b2b55fae3))
* **PDisk:** display vdisks donors ([8b39b01](https://github.com/ydb-platform/ydb-embedded-ui/commit/8b39b01e8bf62624e9e12ac0a329fda5d03cc8df))

## [3.4.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.4.0...v3.4.1) (2023-03-01)


### Bug Fixes

* **Consumers:** enable navigation to Partitions tab ([fa79081](https://github.com/ydb-platform/ydb-embedded-ui/commit/fa7908124bc4392e272aa829fd4e5c1639fcf209))
* **Consumers:** update topic stats values align ([f2af851](https://github.com/ydb-platform/ydb-embedded-ui/commit/f2af851208a640ef9aa392fd7176eb579a2401db))
* **TopShards:** keep state on request cancel ([1bd4f65](https://github.com/ydb-platform/ydb-embedded-ui/commit/1bd4f65dd047b42f8edf9e4bb41c722f30220d77))

## [3.4.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.3.4...v3.4.0) (2023-02-17)


### Features

* **Diagnostics:** add Partitions tab ([914702b](https://github.com/ydb-platform/ydb-embedded-ui/commit/914702be7e8aea28fcdc9f2ddf1cb7356995146a))
* **Diagnostics:** rework Consumers tab ([0dae9d8](https://github.com/ydb-platform/ydb-embedded-ui/commit/0dae9d84c254d556db2a0d18345fdc10c152172a))


### Bug Fixes

* add read and lag images ([a3f0648](https://github.com/ydb-platform/ydb-embedded-ui/commit/a3f0648fc4f23c2ac2c9e73c4078bf5f06d1a57e))
* add reducer for consumer ([4ab65e3](https://github.com/ydb-platform/ydb-embedded-ui/commit/4ab65e3fb3dd4f29b4757473275ba84bec0f5411))
* add SpeedMultiMeter component ([39acbf1](https://github.com/ydb-platform/ydb-embedded-ui/commit/39acbf1a1e234f36a090b29935872e694e1525c0))
* **ResponseError:** make error prop optional ([f706e94](https://github.com/ydb-platform/ydb-embedded-ui/commit/f706e940e51e62841e18338775b01183831761e1))
* **Storage:** display not full donors ([13f4b9f](https://github.com/ydb-platform/ydb-embedded-ui/commit/13f4b9fe9f796e8ef6fee094f7b5bc6056e2833b))
* **Topic:** use SpeedMultiMeter and utils functions ([3e0293c](https://github.com/ydb-platform/ydb-embedded-ui/commit/3e0293cc5cf69c2dee5b6c4cdcf053829960dac5))
* **utils:** add formatBytesCustom function ([2f18c22](https://github.com/ydb-platform/ydb-embedded-ui/commit/2f18c2233b37b666e16327af0ca8e20bccf01de6))

## [3.3.4](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.3.3...v3.3.4) (2023-02-16)


### Bug Fixes

* **OverloadedShards:** rename to top shards ([ffa4f27](https://github.com/ydb-platform/ydb-embedded-ui/commit/ffa4f27f2cf0a5e12b2800c81bf61b1d3c25912c))
* **StorageGroups:** display Erasure ([4a7ebc0](https://github.com/ydb-platform/ydb-embedded-ui/commit/4a7ebc08b87fe75af83df70a38ebd486d64d6d4e))
* **TopShards:** switch between history and immediate data ([eeb9bb0](https://github.com/ydb-platform/ydb-embedded-ui/commit/eeb9bb0911b9e889b633558c9d3c13f986f72bfe))

## [3.3.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.3.2...v3.3.3) (2023-02-08)


### Bug Fixes

* **Auth:** add a step in history for auth form ([c72d06e](https://github.com/ydb-platform/ydb-embedded-ui/commit/c72d06ecacdba47cac59bd705c1185e1ddf0b20d))
* format dates with date-utils ([948598b](https://github.com/ydb-platform/ydb-embedded-ui/commit/948598b83c9bdd09268d128e15a42d5a6e0c15cc))
* **InfoViewer:** add prop renderEmptyState ([44fe28f](https://github.com/ydb-platform/ydb-embedded-ui/commit/44fe28f72ea299b3b5d9b5a33a0a0130d471f7dd))
* minor fixes in Nodes and Tenants tables ([8dca43a](https://github.com/ydb-platform/ydb-embedded-ui/commit/8dca43a482b0da31dbc618875b416dcfcedac036))
* **OverloadedShards:** display IntervalEnd ([c7cbd72](https://github.com/ydb-platform/ydb-embedded-ui/commit/c7cbd7215eaf60601941410acb13ffb25d151eb9))
* **Overview:** display error statusText on schema error ([99b030f](https://github.com/ydb-platform/ydb-embedded-ui/commit/99b030f90e6044e98a151e5128603835c84e1b4e))
* **PDisk:** calculate severity based on usage ([64c6890](https://github.com/ydb-platform/ydb-embedded-ui/commit/64c6890ac6d5a77aef73da7dfc7f1eaff8a72441))
* **QueryEditor:** make client request timeout 9 min ([44528a8](https://github.com/ydb-platform/ydb-embedded-ui/commit/44528a865b039003cda4c7b1b1367840da015d09))
* **QueryEditor:** result status for aborted connection ([4b0d84b](https://github.com/ydb-platform/ydb-embedded-ui/commit/4b0d84b550deb41a140d4a3d215e52084507a558))
* **QueryResult:** output client error messages ([deef610](https://github.com/ydb-platform/ydb-embedded-ui/commit/deef6103f4d08825837520cab9e8ae5b8c7fd496))
* **Storage:** replace hasOwn to hasOwnProperty ([2452310](https://github.com/ydb-platform/ydb-embedded-ui/commit/2452310ce8e953d7a9ee4bbaa2bd466396aa0131))
* **TopQueries:** display IntervalEnd ([e5b2b07](https://github.com/ydb-platform/ydb-embedded-ui/commit/e5b2b07cf1e686c20817dcdc1ae32e0c8912a21a))

## [3.3.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.3.1...v3.3.2) (2023-01-31)


### Bug Fixes

* **QueryEditor:** collapse bottom panel if empty ([566db3b](https://github.com/ydb-platform/ydb-embedded-ui/commit/566db3b15c4393555071f058c88ad36b4073cc2d))
* **VDisk:** use pdiskid field for link ([5ee0705](https://github.com/ydb-platform/ydb-embedded-ui/commit/5ee0705416aa31be9bee4be0776ecb8a61d3e82c))

## [3.3.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.3.0...v3.3.1) (2023-01-31)


### Bug Fixes

* **UserSettings:** reword nodes setting and add popup ([2fda2b8](https://github.com/ydb-platform/ydb-embedded-ui/commit/2fda2b815b921a8163f80527c45f788172df4ba8))

## [3.3.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.2.3...v3.3.0) (2023-01-30)


### Features

* **Nodes:** use /viewer/json/nodes endpoint ([226cc70](https://github.com/ydb-platform/ydb-embedded-ui/commit/226cc70dcb89262890856b4d0cb03eac0675256d))
* **Overview:** display topic stats for topics and streams ([08e9fe0](https://github.com/ydb-platform/ydb-embedded-ui/commit/08e9fe0ee379715229474322a03ec668e26bdb9b))
* **Storage:** display vdisks over pdisks ([bb5d1fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/bb5d1fa5ae2953ca30b13df45340b7a1a63056cb))


### Bug Fixes

* add duration formatter ([e325d98](https://github.com/ydb-platform/ydb-embedded-ui/commit/e325d98845d29dea208debdfcb88d330c1d6daee))
* add protobuf time formatters ([c74cd9d](https://github.com/ydb-platform/ydb-embedded-ui/commit/c74cd9d0949674414ba2c9754e3dcc5c2be622a5))
* add verticalBars component ([053ffa8](https://github.com/ydb-platform/ydb-embedded-ui/commit/053ffa8fd460f89f4296a96fcf46a9267ac4cae3))
* **PDisk:** grey color for unknown state ([54f7e15](https://github.com/ydb-platform/ydb-embedded-ui/commit/54f7e159aaddd932ccecddfb10265ee596fed1e2))
* **Storage:** request only static nodes ([e91e136](https://github.com/ydb-platform/ydb-embedded-ui/commit/e91e136d7c72bea694c7a282c83d577cc60e5386))
* **Topic:** add reducer for describe_topic ([7c61dc9](https://github.com/ydb-platform/ydb-embedded-ui/commit/7c61dc906452df2e1a77a2ff602916f6ea785df5))
* update PDisks and VDisks tests ([3bf660e](https://github.com/ydb-platform/ydb-embedded-ui/commit/3bf660e41d92e1a32444872c5fb9d47209bef8b5))

## [3.2.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.2.2...v3.2.3) (2023-01-16)


### Bug Fixes

* fix crash on invalid search query ([4d6f551](https://github.com/ydb-platform/ydb-embedded-ui/commit/4d6f551fa4348a05ca3d8d2d6bd8b52ccb6310ee))

## [3.2.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.2.1...v3.2.2) (2023-01-13)


### Bug Fixes

* **Tablets:** fix infinite rerender ([79b3c58](https://github.com/ydb-platform/ydb-embedded-ui/commit/79b3c58fb7c3ff7f123e111189b10f42c5272401))

## [3.2.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.2.0...v3.2.1) (2023-01-12)


### Bug Fixes

* align standard errors to the left ([cce100c](https://github.com/ydb-platform/ydb-embedded-ui/commit/cce100c5df83243df1fb0bc59d84d0d9b33719e6))
* **TabletsFilters:** properly display long data in select options ([ea37d9f](https://github.com/ydb-platform/ydb-embedded-ui/commit/ea37d9fc08245ccdd38a6120dd620f59a528879c))
* **TabletsFilters:** replace constants ([ea948ca](https://github.com/ydb-platform/ydb-embedded-ui/commit/ea948ca86276b5521979105b2ab99546da389e80))
* **TabletsStatistic:** process different tablets state types ([78798de](https://github.com/ydb-platform/ydb-embedded-ui/commit/78798de984bf4f6133515bb1c440e4fe0d15b07e))
* **Tenant:** always display Pools heading ([94baeff](https://github.com/ydb-platform/ydb-embedded-ui/commit/94baeff82f9c2c1aecda7c11c3b090125ba9e4b6))

## [3.2.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.1.0...v3.2.0) (2023-01-09)


### Features

* **Nodes:** display rack in table ([3b8cdd5](https://github.com/ydb-platform/ydb-embedded-ui/commit/3b8cdd5b472f98132b2faaa9b71b8911750545a6))
* **StorageNodes:** display datacenter in table ([4507bfd](https://github.com/ydb-platform/ydb-embedded-ui/commit/4507bfde839b0aafa3722828b7528885c6ac8f84))
* **TopQueries:** date range filter ([b9a8e95](https://github.com/ydb-platform/ydb-embedded-ui/commit/b9a8e9504fa68556a724b214ee91b73ec900d37e))
* **TopQueries:** filter by query text ([2c8ea97](https://github.com/ydb-platform/ydb-embedded-ui/commit/2c8ea97dd215ea59165cf05315bc5809cf7fafd7))


### Bug Fixes

* **InfoViewer:** min width for values ([64a4fd4](https://github.com/ydb-platform/ydb-embedded-ui/commit/64a4fd4de16738a9e2fac9cb4fba94eafc938762))
* **Nodes:** open external link in new tab ([b7c3ddd](https://github.com/ydb-platform/ydb-embedded-ui/commit/b7c3ddd1e611f2b61466e3eda51f3341f8407588))
* **TopQueries:** proper table dynamic render type ([9add6ca](https://github.com/ydb-platform/ydb-embedded-ui/commit/9add6ca9fbfe0475caf1586070a800210320cee6))
* **TopShards:** rename to overloaded shards ([d9978bd](https://github.com/ydb-platform/ydb-embedded-ui/commit/d9978bdd84b9a883e4eefcac7f85f856da55d770))
* **UserSettings:** treat invertedDisks settings as string ([ad7742a](https://github.com/ydb-platform/ydb-embedded-ui/commit/ad7742a6bf0be59c2b9cbbf947aaa66f79d748be))

## [3.1.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.0.1...v3.1.0) (2022-12-13)


### Features

* **TopShards:** date range filter ([aab4396](https://github.com/ydb-platform/ydb-embedded-ui/commit/aab439600ec28d30799c4a7ef7a9c68fcacc148c))

## [3.0.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v3.0.0...v3.0.1) (2022-12-12)


### Bug Fixes

* **Overview:** display titles for topic, stream and tableIndex ([2ee7889](https://github.com/ydb-platform/ydb-embedded-ui/commit/2ee788932d4f0a6fbe3e9e0526b8ba50e3103d76))
* **SchemaOverview:** display entity name ([2d28a2a](https://github.com/ydb-platform/ydb-embedded-ui/commit/2d28a2ad30263e31bc3c8b783d4f42af92537624))
* **TenantOverview:** display database type in title ([5f73eed](https://github.com/ydb-platform/ydb-embedded-ui/commit/5f73eed6f9043586885f8e68137d8f31923e8e3b))
* **TopShards:** render a message for empty data ([8cda003](https://github.com/ydb-platform/ydb-embedded-ui/commit/8cda0038396b356b10033b44824933f711e1175e))

## [3.0.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.6.0...v3.0.0) (2022-12-05)


### ⚠ BREAKING CHANGES

Updated build config ([11e02c6](https://github.com/ydb-platform/ydb-embedded-ui/commit/11e02c668ef186f058b2ece9d5f1082d0e96e23d))

**Before the change**
- the target dir for the production build was `build/resources`
- `favicon.png` was placed directly in `build`

**After the change**
- the target dir is `build/static`
- `favicon.png` is in `build/static`

This change is intended to simplify build config and make it closer to the default one. Previously there were some custom tweaks after the build, they caused bugs and were hard to maintain. Now the application builds using the default `create-react-app` config.


## [2.6.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.5.0...v2.6.0) (2022-12-05)


### Features

* **Describe:** add topic data for CDCStream ([3a289d4](https://github.com/ydb-platform/ydb-embedded-ui/commit/3a289d4f6452e3f2d719c0d508f48b389fd044d7))
* **Diagnostics:** add consumers tab for CdcStream ([22c6efd](https://github.com/ydb-platform/ydb-embedded-ui/commit/22c6efdd39d85ab1585943bc13d88cf03f9bc2ae))
* **Overview:** add topic data for CDCStream ([be80545](https://github.com/ydb-platform/ydb-embedded-ui/commit/be80545df65a03820265875fedd98c6f181af491))


### Bug Fixes

* **Compute:** update data on path change ([1783240](https://github.com/ydb-platform/ydb-embedded-ui/commit/17832403623ae3e718f47aec508c834cd2e3458c))
* **Diagnostics:** render db tabs for not root dbs ([7d46ce2](https://github.com/ydb-platform/ydb-embedded-ui/commit/7d46ce2783a58b1ae6e41cae6592e78f95d61bcc))
* **Healthcheck:** render loader on path change ([ec40f19](https://github.com/ydb-platform/ydb-embedded-ui/commit/ec40f19c0b369de0b8d0658b4a1dd68c5c419c1c))
* **InfoViewer:** allow multiline values ([17755dc](https://github.com/ydb-platform/ydb-embedded-ui/commit/17755dc2eae7b6fc0a56ff70da95679fc590dccb))
* **Network:** update data on path change ([588c53f](https://github.com/ydb-platform/ydb-embedded-ui/commit/588c53f80a81376301216a77d9ead95cdff9812f))
* **SchemaTree:** do not expand childless components ([90468de](https://github.com/ydb-platform/ydb-embedded-ui/commit/90468de74b74e00a66255ba042378c9d7e1cbc27))
* **Storage:** update data on path change ([f5486bc](https://github.com/ydb-platform/ydb-embedded-ui/commit/f5486bcb2838b9e290c566089980533b4d22d035))
* **Tablets:** fix postponed data update on path change ([d474c6c](https://github.com/ydb-platform/ydb-embedded-ui/commit/d474c6cb36597f0c720ef3bb8d0360ec73973e26))
* **TopQueries:** update data on path change ([32d7720](https://github.com/ydb-platform/ydb-embedded-ui/commit/32d77208b8ef09682c41160c60a1a7742b0c6c4c))

## [2.5.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.4.4...v2.5.0) (2022-11-25)


### Features

* **Nodes:** add uptime filter ([9bb4f66](https://github.com/ydb-platform/ydb-embedded-ui/commit/9bb4f664df8fadec5b5e612b2adb866c28415efa))
* **NodesViewer:** add uptime filter ([a802442](https://github.com/ydb-platform/ydb-embedded-ui/commit/a8024422a09ff95e55c399d26046f5103cab3f89))
* **Storage:** add nodes uptime filter ([d8cfea1](https://github.com/ydb-platform/ydb-embedded-ui/commit/d8cfea14369e8235d1f7ef86a9a3f34c05efdf5c))


### Bug Fixes

* **Consumers:** add autorefresh to useAutofetcher ([e0da2a1](https://github.com/ydb-platform/ydb-embedded-ui/commit/e0da2a11fcd18cb8ba808a07873a78cbf7191cdc))
* **Consumers:** add loader ([a59f472](https://github.com/ydb-platform/ydb-embedded-ui/commit/a59f472fd7c9347bcde8cc21d4001f999fc88110))
* **QueryExplain:** fix schema rerender on path change ([eb52978](https://github.com/ydb-platform/ydb-embedded-ui/commit/eb529787bf747bb2bf49bae65676011426341a23))
* **Storage:** add message on empty nodes with small uptime ([70959ab](https://github.com/ydb-platform/ydb-embedded-ui/commit/70959ab90bd0f81ebab7712b7d34c0ca80f4dd0b))
* **Storage:** fix uneven PDisks ([0269dba](https://github.com/ydb-platform/ydb-embedded-ui/commit/0269dbab0336ae5b8cbf43e1b52458e932527a66))
* **StorageNodes:** fix message display on not empty data ([bb5fffa](https://github.com/ydb-platform/ydb-embedded-ui/commit/bb5fffa786cde3f680375f8e11e3893c52c4f6da))
* **UsageFilter:** add min-width ([56b2701](https://github.com/ydb-platform/ydb-embedded-ui/commit/56b2701a17420e0322fac0223bce26e18a2f0e47))

## [2.4.4](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.4.3...v2.4.4) (2022-11-22)


### Bug Fixes

* **api:** update getDescribe and getSchema requests params ([d70ba54](https://github.com/ydb-platform/ydb-embedded-ui/commit/d70ba54b90b9c86a393bd3f7845183114e5afbf1))
* **describe:** cancel concurrent requests ([2f39ad0](https://github.com/ydb-platform/ydb-embedded-ui/commit/2f39ad0f736d44c3749d9523f5024151c51fcf6f))
* **Describe:** render loader on path change ([baf552a](https://github.com/ydb-platform/ydb-embedded-ui/commit/baf552af8bb67046baa36e9115064b4b192cb015))
* **QueryExplain:** fix colors on theme change ([cc0a2d6](https://github.com/ydb-platform/ydb-embedded-ui/commit/cc0a2d67139457748089c6bf1fb1045b0a6b0b93))
* **SchemaTree:** remove unneeded fetches ([c7c0489](https://github.com/ydb-platform/ydb-embedded-ui/commit/c7c048937c5ae9e5e243d6e538aab8c2e2921df5))
* **SchemaTree:** remove unneeded getDescribe ([1146f13](https://github.com/ydb-platform/ydb-embedded-ui/commit/1146f13a7a5a277a292b3789d45a0872dda0c487))
* **Tenant:** make tenant fetch schema only on tenant change ([ccefbff](https://github.com/ydb-platform/ydb-embedded-ui/commit/ccefbffea08fc8f248a3dd1135e82de6db9f0645))

## [2.4.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.4.2...v2.4.3) (2022-11-14)


### Bug Fixes

* fix app crash on ColumnTable path type ([a1aefa8](https://github.com/ydb-platform/ydb-embedded-ui/commit/a1aefa876600b1b459bf3024f0704883431df5a2))
* **schema:** add types for ColumnTable and ColumnStore ([dc13307](https://github.com/ydb-platform/ydb-embedded-ui/commit/dc13307dcea801c05863b7dd5ee19f01aa074c85))

## [2.4.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.4.1...v2.4.2) (2022-11-09)


### Bug Fixes

* **QueryExplain:** apply all node types ([06d26de](https://github.com/ydb-platform/ydb-embedded-ui/commit/06d26def15496f8e2de00d941b39bf6a68382f14))

## [2.4.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.4.0...v2.4.1) (2022-11-01)


### Performance Improvements

* **SchemaTree:** batch preloaded data dispatch ([c9ac514](https://github.com/ydb-platform/ydb-embedded-ui/commit/c9ac514aabf5e9674aae95956604f47ba8a2d257))

## [2.4.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.3.0...v2.4.0) (2022-10-27)


### Features

* **Diagnostics:** add consumers tab for topics ([4bb801c](https://github.com/ydb-platform/ydb-embedded-ui/commit/4bb801c0ef19dcda227c59e464b08f5e8f284c38))


### Bug Fixes

* add checks for fetch failure with no errors ([2c55107](https://github.com/ydb-platform/ydb-embedded-ui/commit/2c55107a7b47b3540ed0af66630ff85591f269a1))
* **Nodes:** display access denied on 403 ([7832afe](https://github.com/ydb-platform/ydb-embedded-ui/commit/7832afee601a40fc8b75f83bf0ed18b01c798d71))
* **QueryResult:** fix table display in fullscreen ([98674db](https://github.com/ydb-platform/ydb-embedded-ui/commit/98674db26b5fb09ac0d039a7779ae0c58951adde))
* **QueryResultTable:** make preview display all rows ([0ac83d0](https://github.com/ydb-platform/ydb-embedded-ui/commit/0ac83d0258b0d0d3d2e14c06be096fe5ddce02da))
* **Storage:** display access denied on 403 ([6d20333](https://github.com/ydb-platform/ydb-embedded-ui/commit/6d2033378956a54f05190905b0d537c6bd6c9851))
* **TabletsFilters:** display access denied on 403 ([018be19](https://github.com/ydb-platform/ydb-embedded-ui/commit/018be199602123f1d90e58c0b95545f6accc41fb))

## [2.3.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.2.1...v2.3.0) (2022-10-24)


### Features

* **PDisk:** display type on disk progressbar ([00bcbf5](https://github.com/ydb-platform/ydb-embedded-ui/commit/00bcbf5d439ca3bb4834fd5f191c65f0ac62585f))
* **Storage:** display media type for groups ([cdff5e9](https://github.com/ydb-platform/ydb-embedded-ui/commit/cdff5e9882f3f1f8769a3aeaf3e53c05f3ce1c07))
* **Storage:** display shield icon for encrypted groups ([d0a4442](https://github.com/ydb-platform/ydb-embedded-ui/commit/d0a4442dc100c312dcc54afcf685057cc587211d))


### Bug Fixes

* **Diagnostics:** fix tabs reset on page reload ([68d2971](https://github.com/ydb-platform/ydb-embedded-ui/commit/68d297165aea1360d1081349d8133804004f8fe0))
* **Storage:** prevent loading reset on cancelled fetch ([625159a](https://github.com/ydb-platform/ydb-embedded-ui/commit/625159a396e1ab84fe9da94d047da67fdd03b30f))
* **Storage:** shrink tooltip active area on FQDN ([7c33d5a](https://github.com/ydb-platform/ydb-embedded-ui/commit/7c33d5afb561efa64f90ce5b93edd30f7d27c247))
* **Tenant:** prevent selected tab reset on tree navigation ([a4e633a](https://github.com/ydb-platform/ydb-embedded-ui/commit/a4e633aa45c803503fe69e52f0f2cfac4c6aae0d))
* **Tenant:** show loader when fetching overview data ([ae77495](https://github.com/ydb-platform/ydb-embedded-ui/commit/ae77495faa687652040a1f2965700184220778b4))
* use correct prop for textinputs value ([de97ba1](https://github.com/ydb-platform/ydb-embedded-ui/commit/de97ba17ba8da54a626509cf08f147f9fcc67004))
* **useAutofetcher:** pass argument to indicate background fetch ([4063cb1](https://github.com/ydb-platform/ydb-embedded-ui/commit/4063cb1411338d351b612fc46c06bcc708fe32f1))

## [2.2.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.2.0...v2.2.1) (2022-10-19)


### Bug Fixes

* revert prettier config, fix build ([c47dddf](https://github.com/ydb-platform/ydb-embedded-ui/commit/c47dddf834eadfd5642af62e0cc94f7567ec68fd))

## [2.2.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.1.0...v2.2.0) (2022-10-14)


### Features

* **Healthcheck:** rework issues list in modal ([e7cb0df](https://github.com/ydb-platform/ydb-embedded-ui/commit/e7cb0df58e22c8c9cd25aae83b78be4808e9ba81))


### Bug Fixes

* **EntityStatus:** enable component to left trim links ([fbc6c51](https://github.com/ydb-platform/ydb-embedded-ui/commit/fbc6c51f9fbea3c1a7f5f70cb542971a41f4d8b3))
* fix pre-commit prettier linting and add json linting ([#189](https://github.com/ydb-platform/ydb-embedded-ui/issues/189)) ([047415d](https://github.com/ydb-platform/ydb-embedded-ui/commit/047415d2d69ecf4a2d99f0092b9e6735bd8efbc0))
* **Healthcheck:** delete unneeded i18n translations ([0c6de90](https://github.com/ydb-platform/ydb-embedded-ui/commit/0c6de9031607e4cde1387387393a9cfc9e1e2b8f))
* **Healthcheck:** enable update button in modal to fetch data ([de0b06e](https://github.com/ydb-platform/ydb-embedded-ui/commit/de0b06e7f2d3536df1b3896cbf86a947b2e7a291))
* **Healthcheck:** fix layout shift on scrollbar appearance ([ccdde6e](https://github.com/ydb-platform/ydb-embedded-ui/commit/ccdde6e065abbdb1c22a2c3bdd17e63f706d0f77))
* **Healthcheck:** fix styles for long issues trees ([32f1a8d](https://github.com/ydb-platform/ydb-embedded-ui/commit/32f1a8db58d9f84073327b92dcd80a5b4626a526))
* **Healthcheck:** fix variable typo ([0f0e056](https://github.com/ydb-platform/ydb-embedded-ui/commit/0f0e056576b9ec18fc3ce574d3742d55e5da6e35))
* **Healthcheck:** full check status in a preview ([bc0b51e](https://github.com/ydb-platform/ydb-embedded-ui/commit/bc0b51eedd4ff3b4ae1650946832f463a6703c12))
* **Healthcheck:** make modal show only one first level issue ([cdc95a7](https://github.com/ydb-platform/ydb-embedded-ui/commit/cdc95a7412c1266d990df7e2807630a8f4c88780))
* **Healthcheck:** redesign healthcheck header ([867f57a](https://github.com/ydb-platform/ydb-embedded-ui/commit/867f57aed84b7b72c22a816c6ac02387490ff495))
* **Healthcheck:** replace update button with icon ([709a994](https://github.com/ydb-platform/ydb-embedded-ui/commit/709a994544f068db1b0fe09009ecb4d8db46fc38))
* **Healthcheck:** update styles to be closer to the design ([aa1083d](https://github.com/ydb-platform/ydb-embedded-ui/commit/aa1083d299e24590336eeb3d913a9c53fd77bad6))
* **Nodes:** case insensitive search ([11d2c98](https://github.com/ydb-platform/ydb-embedded-ui/commit/11d2c985e0c30bb74ed07e22273d8b3459b54c89))
* **QueryEditor:** smarter error message trim ([8632948](https://github.com/ydb-platform/ydb-embedded-ui/commit/863294828090dc8eb2595884283d0996156c3785))
* **Tenants:** case insensitive search ([0ad93f5](https://github.com/ydb-platform/ydb-embedded-ui/commit/0ad93f57dcbba7d9746be54a4ba7b76ab4d45108))
* **Tenants:** fix filtering by ControlPlane name ([4941c82](https://github.com/ydb-platform/ydb-embedded-ui/commit/4941c821cdbb7c5d0da26a3b0d5c00d8979401c0))
* **Tenants:** left trim db names in db list ([81bf0fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/81bf0fafe901d3601dc04fdf71939e914493ff1c))

## [2.1.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v2.0.0...v2.1.0) (2022-10-04)


### Features

* autofocus all text search fields ([a38ee84](https://github.com/ydb-platform/ydb-embedded-ui/commit/a38ee84abad4202f5e9b8af897eb68d2c006233a))
* **Healthcheck:** display first level issues in overview ([10b4bf5](https://github.com/ydb-platform/ydb-embedded-ui/commit/10b4bf5d15d32f028702ff8cfecca0e06bc5616f))


### Bug Fixes

* fix production assets paths ([8eaad0f](https://github.com/ydb-platform/ydb-embedded-ui/commit/8eaad0f1db109c4cf3cbf7d11ad32ea335a6b0c1))
* **Healthcheck:** add translations ([75f9851](https://github.com/ydb-platform/ydb-embedded-ui/commit/75f9851a35766ef692805a6f154d40340b003487))
* move eslint hooks rule extension to src config ([179b81d](https://github.com/ydb-platform/ydb-embedded-ui/commit/179b81d60adf422addc8d72f947800c72bd3e4c5))
* **QueryEditor:** disable fullscreen button for empty result ([4825b5b](https://github.com/ydb-platform/ydb-embedded-ui/commit/4825b5b8dcb89fcafd828dabbace521ddc429922))
* **QueryEditor:** fix query stats spacings ([b836d72](https://github.com/ydb-platform/ydb-embedded-ui/commit/b836d72824a791b3fde2b9e4585c6c9b42385265))
* **useAutofetcher:** private autofetcher instance for each usage ([3f34b7a](https://github.com/ydb-platform/ydb-embedded-ui/commit/3f34b7aee2042562a42e6d1a7daf03ffddd888c0))

## [2.0.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.14.2...v2.0.0) (2022-09-26)


### ⚠ BREAKING CHANGES

* peer deps update: migrated from `@yandex-cloud/uikit` to `@gravity-ui/uikit`


### Bug Fixes

* **QueryEditor:** adjust execute issues scrollbar position ([8b03400](https://github.com/ydb-platform/ydb-embedded-ui/commit/8b03400aa084a660f44dced437a97e4b956704d6))
* **QueryEditor:** adjust explain components position ([193d326](https://github.com/ydb-platform/ydb-embedded-ui/commit/193d3263c2c9b57381f8d5ba160b95e76b5d32af))
* **QueryEditor:** properly handle empty query explanations ([5943d1b](https://github.com/ydb-platform/ydb-embedded-ui/commit/5943d1b38534e26729310e34aa24dc30a658a0fa))
* **QueryEditor:** render v2 explain with default topology ([44947e1](https://github.com/ydb-platform/ydb-embedded-ui/commit/44947e10248f5d14d0d685a030e2dbca0c87399d))
* **QueryEditor:** use modern explain query schema ([78acc45](https://github.com/ydb-platform/ydb-embedded-ui/commit/78acc45765d9f9ff45a37934be61559373b5c07c))
* **Storage:** encouraging message for empty filtered lists ([028aa8d](https://github.com/ydb-platform/ydb-embedded-ui/commit/028aa8db2ddff9f64d1b6ac6543d7d640a3187a9))
* **Tenant:** adjust info tab spacings ([89e5809](https://github.com/ydb-platform/ydb-embedded-ui/commit/89e580939766c2ed4018b4e46c3b34d8744a9957))
* **Tenant:** display 0 values in columns tables info ([ba2cbde](https://github.com/ydb-platform/ydb-embedded-ui/commit/ba2cbde662471dfbe34892154aa2211088100f31))
* **Tenant:** modern query response for column tables ([ab2e45f](https://github.com/ydb-platform/ydb-embedded-ui/commit/ab2e45f4df33a2366f3a673b1beab97f3d76a3a4))
* **Tenant:** properly fetch column tables data for info tab ([8762746](https://github.com/ydb-platform/ydb-embedded-ui/commit/8762746d9c89faeea25f9f47107b6d93fffee918))
* **TopQueries:** modern query response ([fe2b45a](https://github.com/ydb-platform/ydb-embedded-ui/commit/fe2b45a15b25c4d1ca8324e9727bee9194bdb9bc))
* **TopShards:** modern query response ([3f847eb](https://github.com/ydb-platform/ydb-embedded-ui/commit/3f847eb23fe1fca216e2026764a897cbafd56a38))
* **UserSettings:** save invertedDisks as string ([d41dcc6](https://github.com/ydb-platform/ydb-embedded-ui/commit/d41dcc68d4eff47ddb54781e1bbd8192ba669500))

## [1.14.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.14.1...v1.14.2) (2022-09-19)


### Bug Fixes

* process new explain format ([2ede9ab](https://github.com/ydb-platform/ydb-embedded-ui/commit/2ede9ab11a29667204cca110858b0cca74588255))
* process new query format ([eb880be](https://github.com/ydb-platform/ydb-embedded-ui/commit/eb880be36b99efe7f0c0ff96b58401293ff080e1))

## [1.14.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.14.0...v1.14.1) (2022-09-16)


### Bug Fixes

* **Tenants:** display nodes count 0 for undefined NodeIds ([4be42ec](https://github.com/ydb-platform/ydb-embedded-ui/commit/4be42eca84557929837e799d7d8dcebd858470d4))

## [1.14.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.13.2...v1.14.0) (2022-09-16)


### Features

* **Preview:** use modern query schema ([60bed3f](https://github.com/ydb-platform/ydb-embedded-ui/commit/60bed3fcb0fd76b869883742a2f2911201c0c226))
* **QueryEditor:** use modern query schema ([ecf38aa](https://github.com/ydb-platform/ydb-embedded-ui/commit/ecf38aa6b164ef7705e004aa77c8dab0e3164b51))
* **QueryResultTable:** component for displaying query result ([1b8be10](https://github.com/ydb-platform/ydb-embedded-ui/commit/1b8be10546ad9ae13b1043b2871b2aa110a5b6d4))
* **Storage:** experimental settings for disk colors ([b4291f4](https://github.com/ydb-platform/ydb-embedded-ui/commit/b4291f4ca19c588bc17eca50da51e898e6ccf581))
* **Tenant:** cdc streams info ([4cc773f](https://github.com/ydb-platform/ydb-embedded-ui/commit/4cc773f0351e3f1f6e279d1bebbb78329695e9ae))
* **Tenant:** cdc streams overview ([d1aed44](https://github.com/ydb-platform/ydb-embedded-ui/commit/d1aed4467135adaf01a06f8c4c4a4b3eb0b53106))
* **Tenant:** pq groups info & overview ([e1878a6](https://github.com/ydb-platform/ydb-embedded-ui/commit/e1878a6353933f74e62b204bf210f56a18a16c49))
* **Tenants:** display tenant nodes count ([72aef25](https://github.com/ydb-platform/ydb-embedded-ui/commit/72aef250006aae53d7704ff539b9eb537e6bfbd4))
* use schema param in sendQuery api ([01f9c71](https://github.com/ydb-platform/ydb-embedded-ui/commit/01f9c71190622279f03cd1c01d6b6e8e6739362a))


### UI Updates

* **Storage:** new disks design ([26033d2](https://github.com/ydb-platform/ydb-embedded-ui/commit/26033d21e994c6ece7b3b8999d0fabbf82b43021))
* **Tenant:** consistent paddings for query results ([7f0a7c2](https://github.com/ydb-platform/ydb-embedded-ui/commit/7f0a7c28d18e48013223239b5780dbaca18f68a8))


### Bug Fixes

* always parse query error to string ([0fcabf7](https://github.com/ydb-platform/ydb-embedded-ui/commit/0fcabf7042adfc728f1ec651ebae50e8c40e9199))
* correct types & parsing for query api response ([d6a177c](https://github.com/ydb-platform/ydb-embedded-ui/commit/d6a177cd0e726f1d19e27c642e0a9c1d2832bbe0))
* **Preview:** display "table is empty" only for tables ([21a93c1](https://github.com/ydb-platform/ydb-embedded-ui/commit/21a93c1a070dbd04f7338537200cd2cb9849ff88))
* **Preview:** fix action type id ([7793fad](https://github.com/ydb-platform/ydb-embedded-ui/commit/7793fad6b618bfc4c35b85481b2a0b794698eaa1))
* **QueryResultTable:** don't display absent result as empty ([e2e5bfa](https://github.com/ydb-platform/ydb-embedded-ui/commit/e2e5bfaf0dbb89ec64766bf4ed5a4fab10ae8844))
* **QueryResultTable:** don't require theme prop ([c9686d4](https://github.com/ydb-platform/ydb-embedded-ui/commit/c9686d46eb2efdeb4bc093ecd44619e6c1a9c2fd))
* **Tenant:** input working query for 'select query' action in schema ([de152bd](https://github.com/ydb-platform/ydb-embedded-ui/commit/de152bdcc38fd6f4b1e5a5e6102c621f0155be36))
* **Tenant:** rename tab overview -> info ([2d13ffe](https://github.com/ydb-platform/ydb-embedded-ui/commit/2d13ffeb149765680c2887ea7ffb86d68ac92d5c))

## [1.13.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.13.1...v1.13.2) (2022-09-05)


### Bug Fixes

* **Tenant:** fix acl scroll ([161bc8d](https://github.com/ydb-platform/ydb-embedded-ui/commit/161bc8d507de126c1383a10713e2ffaaaf13301d))
* **Tenant:** fix layout after moving tabs ([6abfded](https://github.com/ydb-platform/ydb-embedded-ui/commit/6abfdedb97345b555be306d49ea2454f35de9bb4))
* **Tenant:** load root if cahced path is not in tree ([2d86044](https://github.com/ydb-platform/ydb-embedded-ui/commit/2d8604464711a638dbd20cf8a14142b0de3e3a95))

## [1.13.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.13.0...v1.13.1) (2022-09-02)


### Bug Fixes

* **Storage:** fix groups/nodes counter ([9b59ae0](https://github.com/ydb-platform/ydb-embedded-ui/commit/9b59ae0d045beff7aa45560e028618a88bd8483f))

## [1.13.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.12.2...v1.13.0) (2022-09-01)


### Features

* **Storage:** add usage filter component ([a35067f](https://github.com/ydb-platform/ydb-embedded-ui/commit/a35067f8c34ad5d3faf4fb9381c0d6023df9afbd))
* **Storage:** usage filter ([276f027](https://github.com/ydb-platform/ydb-embedded-ui/commit/276f0270a458601929624a4872ec81e001931853))


### Bug Fixes

* **Storage:** properly debounce text input filter ([bc5e8fd](https://github.com/ydb-platform/ydb-embedded-ui/commit/bc5e8fd7b067b850f0376b55d995213292b8a31e))
* **Storage:** use current list size for counter ([e6fea58](https://github.com/ydb-platform/ydb-embedded-ui/commit/e6fea58b075de4c35ad8a60d339417c1e7204d83))
* **Tenant:** move general tabs outside navigation ([5bf21ea](https://github.com/ydb-platform/ydb-embedded-ui/commit/5bf21eac6f38c0392c8dc6e04be1b6fd0e147064))

## [1.12.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.12.1...v1.12.2) (2022-08-29)


### Bug Fixes

* **Storage:** bright red usage starting from 90% ([69b7ed2](https://github.com/ydb-platform/ydb-embedded-ui/commit/69b7ed248151f518ffc5fabbdccf5ea9bbcd9405))
* **Storage:** display usage without gte sign ([39630a2](https://github.com/ydb-platform/ydb-embedded-ui/commit/39630a2a06b574d53d0ef74c1b3e0dc96b9666a8))

## [1.12.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.12.0...v1.12.1) (2022-08-26)


### Bug Fixes

* **Storage:** properly display usage for 0 storage ([aee67f9](https://github.com/ydb-platform/ydb-embedded-ui/commit/aee67f9314341c995e2c9468f5eedc48fa0a3d35))

## [1.12.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.11.1...v1.12.0) (2022-08-26)


### Features

* **Storage:** show usage column ([73aed5f](https://github.com/ydb-platform/ydb-embedded-ui/commit/73aed5f9ed60b6d2bd77fd315ae514ee7443c489))
* **Storage:** vividly show degraded disks count ([7315a9c](https://github.com/ydb-platform/ydb-embedded-ui/commit/7315a9cfd98002a7fab85d721712aa82c6dbb552))

## [1.11.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.11.0...v1.11.1) (2022-08-26)


### Bug Fixes

* number type instead of string for uint32 ([e60799e](https://github.com/ydb-platform/ydb-embedded-ui/commit/e60799edec4ef831e8c0d51f4384cde83520541d))
* **Storage:** expect arbitrary donors data ([09f8e08](https://github.com/ydb-platform/ydb-embedded-ui/commit/09f8e085c94faacd9da502643355e932346502ac))
* vdisk data contains pdisk data, not id ([bd1ea7f](https://github.com/ydb-platform/ydb-embedded-ui/commit/bd1ea7f59e0461256bb12f146b50470d21ac1ace))

## [1.11.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.10.3...v1.11.0) (2022-08-23)


### Features

* **Stack:** new component for stacked elements ([c42ba37](https://github.com/ydb-platform/ydb-embedded-ui/commit/c42ba37fafdd9dedc4be9d625d7e756a83c01fe3))
* **Storage:** display donor disks ([b808fe9](https://github.com/ydb-platform/ydb-embedded-ui/commit/b808fe951987c615f797af56017f8045a1ed852f))
* **VDisk:** display label for donors ([bba5ae8](https://github.com/ydb-platform/ydb-embedded-ui/commit/bba5ae8e44347a5b1d9cb72424f5a963a6848e59))


### Bug Fixes

* **InfoViewer:** add size_s ([fc06451](https://github.com/ydb-platform/ydb-embedded-ui/commit/fc0645118f64a79f660d734c2ff43c42c738fd40))
* **PDisk:** new popup design ([9c0355d](https://github.com/ydb-platform/ydb-embedded-ui/commit/9c0355d4d9ccf69d43a5287b0e78d7c7993c4a18))
* **PDisk:** restrict component interface ([328efa9](https://github.com/ydb-platform/ydb-embedded-ui/commit/328efa90d214eca1bceeeb5bd9099aab36a3ddb0))
* **Storage:** shrink tooltip active area on Pool Name ([30a2b92](https://github.com/ydb-platform/ydb-embedded-ui/commit/30a2b92ff598d9caeabe17a4b8de214943945a91))
* **VDisk:** add a missing prop type ([39b6cf3](https://github.com/ydb-platform/ydb-embedded-ui/commit/39b6cf38811cab6c4374c77d3eb63c11fa7b83d5))
* **VDisk:** don't paint donors blue ([6b148b9](https://github.com/ydb-platform/ydb-embedded-ui/commit/6b148b914663a74e528a01a35f575f87ed6e9f09))
* **VDisk:** new popup design ([107b139](https://github.com/ydb-platform/ydb-embedded-ui/commit/107b13900b08631ea42034a6a2f7961c49c86556))

## [1.10.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.10.2...v1.10.3) (2022-08-23)


### Bug Fixes

* **Overview:** format undefined values to empty string, not 0 ([1a37c27](https://github.com/ydb-platform/ydb-embedded-ui/commit/1a37c278328ad8eb4397d9507566829f01a9c872))

## [1.10.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.10.1...v1.10.2) (2022-08-17)


### Bug Fixes

* convert bytes on decimal scale ([db9b0a7](https://github.com/ydb-platform/ydb-embedded-ui/commit/db9b0a71fc5334f5a40992cc6abc0688782ad5d2))
* display HDD instead of ROT as pdisk type ([bd9e5ba](https://github.com/ydb-platform/ydb-embedded-ui/commit/bd9e5ba4e594cb3a1f6a964f619f9824e083ae7c))
* **InfoViewer:** accept default value formatter ([e03d8cc](https://github.com/ydb-platform/ydb-embedded-ui/commit/e03d8cc5de76e4ac00b05586ae6f6522a9708fb0))
* **InfoViewer:** allow longer labels ([89060a3](https://github.com/ydb-platform/ydb-embedded-ui/commit/89060a381858b5beaa3c3cf3402c13c917705676))
* **Overview:** display table r/o replicas ([6dbe0b4](https://github.com/ydb-platform/ydb-embedded-ui/commit/6dbe0b45fc5e3867f9d6141d270c15508a693e35))
* **Overview:** format & group table info in overview ([1a35cfc](https://github.com/ydb-platform/ydb-embedded-ui/commit/1a35cfcd2075454c4a1f1fc4961a4b3106b6d225))
* **QueryEditor:** save chosen run action ([b0fb436](https://github.com/ydb-platform/ydb-embedded-ui/commit/b0fb43651e0c6d1dc5d6a25f92716703402b556d))
* use current i18n lang for numeral formatting ([5d58fcf](https://github.com/ydb-platform/ydb-embedded-ui/commit/5d58fcffde21924f3cbe6c28946c7a9f755a8490))

## [1.10.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.10.0...v1.10.1) (2022-08-10)


### Bug Fixes

* **Tenant:** fix actions set for topics ([0c75bf4](https://github.com/ydb-platform/ydb-embedded-ui/commit/0c75bf4561966dd663ab1cd7c7b81ef6b4632e50))

## [1.10.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.9.0...v1.10.0) (2022-08-10)


### Features

* **TopShards:** add DataSize column ([cbcd047](https://github.com/ydb-platform/ydb-embedded-ui/commit/cbcd047d277f699a67bc002a5542f3b9f6a0c942))
* **TopShards:** sort table data on backend ([dc28c5c](https://github.com/ydb-platform/ydb-embedded-ui/commit/dc28c5c75b0036480bf804d49f82fc54eac98c8e))


### Bug Fixes

* add concurrentId for sendQuery request ([dc6b32a](https://github.com/ydb-platform/ydb-embedded-ui/commit/dc6b32a8fd51064ddeca2fc60a0f08a725216334))
* **Storage:** display pdisk type in tooltip ([2b03a35](https://github.com/ydb-platform/ydb-embedded-ui/commit/2b03a35fc11ddeae3bdd30a0690b324ae917f5c3))
* **Tablet:** change Kill to Restart ([dd585b1](https://github.com/ydb-platform/ydb-embedded-ui/commit/dd585b1d1a6a5ddb484a702523773b169900f582))
* **Tenant:** add missing schema node types ([62a0ecb](https://github.com/ydb-platform/ydb-embedded-ui/commit/62a0ecb848dbcee53e18535cbf7c03a731d0cfeb))
* **Tenant:** ensure correct behavior for new schema node types ([f80c381](https://github.com/ydb-platform/ydb-embedded-ui/commit/f80c38152656e8bbbe51ec38b29fc0d954c361cc))
* **Tenant:** use new schema icons ([389a921](https://github.com/ydb-platform/ydb-embedded-ui/commit/389a9214c64b1adb183fa0c6caa6f2ec536dbef3))
* **TopShards:** disable virtualization for table ([006d3d9](https://github.com/ydb-platform/ydb-embedded-ui/commit/006d3d9fb9a4744b8bb4ad03e53693199213f80e))
* **TopShards:** format DataSize value ([c51ce66](https://github.com/ydb-platform/ydb-embedded-ui/commit/c51ce66286f6454f7252d1194628ee5a50aafba2))
* **TopShards:** only allow DESC sort ([6aa326f](https://github.com/ydb-platform/ydb-embedded-ui/commit/6aa326fc4b8165f00f8b3ecf5becdb0943ed57af))
* **TopShards:** substring tenant name out of shards path ([9e57672](https://github.com/ydb-platform/ydb-embedded-ui/commit/9e5767222c7dac7734c68abd08067cea507b1e15))

## [1.9.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.8...v1.9.0) (2022-07-29)


### Features

* **Node:** display endpoints in overview ([89e9e47](https://github.com/ydb-platform/ydb-embedded-ui/commit/89e9e470499b6f458e8949211d97293c0b7d9b97))
* **Node:** display node basic info above tabs ([aafb15b](https://github.com/ydb-platform/ydb-embedded-ui/commit/aafb15b399bf116026eff36f3c4ac817e2c40e18))
* **Node:** more informative pdisks panels ([342712b](https://github.com/ydb-platform/ydb-embedded-ui/commit/342712bcaa793971e1ca354da57fb962639ef90c))
* **Nodes:** show node endpoints in tooltip ([34be559](https://github.com/ydb-platform/ydb-embedded-ui/commit/34be55957e02f947ede30b43f22fde82d21df308))
* **Tenant:** table index overview ([2aed714](https://github.com/ydb-platform/ydb-embedded-ui/commit/2aed71488cde1175e6569c236ab609bb126f9cf3))
* **Tenant:** virtualized tree in schema ([815f558](https://github.com/ydb-platform/ydb-embedded-ui/commit/815f5588e5fed6fb86f69653c4937e975465372f))
* utils for parsing bitfields in pdisk data ([da22b4a](https://github.com/ydb-platform/ydb-embedded-ui/commit/da22b4afde9efe4d9605cefb69ddd51aed989722))


### Bug Fixes

* **Node:** fix pdisk title items width ([ca5fec6](https://github.com/ydb-platform/ydb-embedded-ui/commit/ca5fec6388364b7d1d6362f1bda36431d9c29749))
* **Nodes:** hide tooltip on unmount ([54e4fdc](https://github.com/ydb-platform/ydb-embedded-ui/commit/54e4fdc8045c555338e79d89a93faf58e888fa0e))
* **ProgressViewer:** apply provided custom class name ([aa60e9d](https://github.com/ydb-platform/ydb-embedded-ui/commit/aa60e9d1b9c0752853f4323d3bcfd220bedd272d))
* **Tenant:** display all table props in overview ([d70e311](https://github.com/ydb-platform/ydb-embedded-ui/commit/d70e311296f6a4d1781f6e72929c70e0db7c3226))
* **Tenant:** display PartCount first in table overview ([8c09746](https://github.com/ydb-platform/ydb-embedded-ui/commit/8c09746b026a23a36fe31be94057cc92535aceaa))

## [1.8.8](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.7...v1.8.8) (2022-07-21)


### Bug Fixes

* **TabletsFilters:** display tablets grid full-height ([0dde809](https://github.com/ydb-platform/ydb-embedded-ui/commit/0dde8097fe026248aade97f034fa35c56b28e903))
* **TabletsOverall:** properly hide tooltip on mouseleave ([df36eba](https://github.com/ydb-platform/ydb-embedded-ui/commit/df36ebaf44d8966bc419f3720d51390dfd767a87))
* **Tablets:** properly display tablets in grid ([f3b64fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/f3b64fae3a1e1a46ababd2d2f04ddff488698676))
* **Tenant:** align info in overview ([acb39fa](https://github.com/ydb-platform/ydb-embedded-ui/commit/acb39fab70b7b4e0e78124fd887b2f1b76815221))
* **Tenant:** display tenant name in single line ([301e391](https://github.com/ydb-platform/ydb-embedded-ui/commit/301e3911330024f80ebfda6d1a16823b64d94b36))
* **Tenant:** move tablets under tenant name ([b7e4b8f](https://github.com/ydb-platform/ydb-embedded-ui/commit/b7e4b8f7027f1481a7c1baff77bf8ad5e2ed467c))

## [1.8.7](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.6...v1.8.7) (2022-07-18)


### Bug Fixes

* **Preview:** sort numbers as numbers, not string ([6c42a62](https://github.com/ydb-platform/ydb-embedded-ui/commit/6c42a62d077fcb9419ceb680906d4cef78a0134f))

## [1.8.6](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.5...v1.8.6) (2022-07-14)


### Bug Fixes

* **Tenant:** fix switching between groups and nodes on storage tab ([6923885](https://github.com/ydb-platform/ydb-embedded-ui/commit/6923885336fa21ac985879e41685137adbf8159a))

## [1.8.5](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.4...v1.8.5) (2022-07-11)


### Bug Fixes

* **AsideNavigation:** aside header is compact by default ([aa3ad03](https://github.com/ydb-platform/ydb-embedded-ui/commit/aa3ad033fc6b62e6f2ee595e266343e67e764ec6))

## [1.8.4](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.3...v1.8.4) (2022-07-11)


### Bug Fixes

* **Nodes:** add /internal for nodes external link ([a649dd2](https://github.com/ydb-platform/ydb-embedded-ui/commit/a649dd209bae4abd6916f23d0894df893602aaf7))

## [1.8.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.2...v1.8.3) (2022-07-08)


### Bug Fixes

* timeout 600 sec for requests /viewer/json/query ([cf65122](https://github.com/ydb-platform/ydb-embedded-ui/commit/cf651221f866e5f56ecf6c900b3778dedc31eb95))

## [1.8.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.1...v1.8.2) (2022-07-07)


### Bug Fixes

* **Tenant:** 3 tabs for indexes ([9280384](https://github.com/ydb-platform/ydb-embedded-ui/commit/9280384733938c4bd269bf6f9adf23efb552c6e8))
* **Tenant:** hide preview button for index tables ([a25e0ea](https://github.com/ydb-platform/ydb-embedded-ui/commit/a25e0ea0413277e27c54d123e2be7a15b8a2aaa4))

## [1.8.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.8.0...v1.8.1) (2022-07-06)


### Bug Fixes

* **Tenant:** diagnostics view for table indexes ([63d3133](https://github.com/ydb-platform/ydb-embedded-ui/commit/63d3133c0d61f6d39186f0c5df2eb6983a9c8bf7))
* **Tenant:** own context actions for table indexes ([3cd946a](https://github.com/ydb-platform/ydb-embedded-ui/commit/3cd946a333be402cec70569affef5865b0dd8934))

## [1.8.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.7.1...v1.8.0) (2022-07-05)


### Features

* add Illustration component ([7d10880](https://github.com/ydb-platform/ydb-embedded-ui/commit/7d10880cd4d9f945e7c8a7232327d8db68f0865c))
* **Tenant:** proper 403 error page ([d822a2b](https://github.com/ydb-platform/ydb-embedded-ui/commit/d822a2b6e3e18c24882ecf30db399087053b83b3))


### Bug Fixes

* fix empty state illustration layout ([7cfd97e](https://github.com/ydb-platform/ydb-embedded-ui/commit/7cfd97e13ebcaa703478bd7b4e29774150bd569e))

## [1.7.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.7.0...v1.7.1) (2022-07-05)


### Performance Improvements

* **Tenant:** use api call viewer/json/acl instead of metainfo ([c3603c4](https://github.com/ydb-platform/ydb-embedded-ui/commit/c3603c4b364cef79cb4790c7e9e4378d5b66e0ed))

## [1.7.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.6.4...v1.7.0) (2022-06-29)


### Features

* **Storage:** show total groups count ([5e31cfe](https://github.com/ydb-platform/ydb-embedded-ui/commit/5e31cfee9edc50fa4bc0770c443b136291a3536e))
* **Storage:** show total nodes count ([b438f70](https://github.com/ydb-platform/ydb-embedded-ui/commit/b438f7075961e878a1412ca185743c4374dd9178))
* **Tenant:** display tables indexes ([693a100](https://github.com/ydb-platform/ydb-embedded-ui/commit/693a1001db6487b2d43aeca7d8168afcd06f5cbd))

## [1.6.4](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.6.3...v1.6.4) (2022-06-24)


### Bug Fixes

* **Tenant:** properly display ColumnTables ([14d1e07](https://github.com/ydb-platform/ydb-embedded-ui/commit/14d1e074bf615be50f4f466d25e605b418f22b47))

## [1.6.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.6.2...v1.6.3) (2022-06-22)


### Bug Fixes

* **ClipboardButton:** clickable area now matches visual area ([8c0b5ef](https://github.com/ydb-platform/ydb-embedded-ui/commit/8c0b5ef27d5d31b28a29455b3019de23bdbf8f68))

## [1.6.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.6.1...v1.6.2) (2022-06-07)


### Bug Fixes

* shouls always select result tab ([98d4bcb](https://github.com/ydb-platform/ydb-embedded-ui/commit/98d4bcbc94bc2b9db9fb9b9cd5aced9f079ecdae))

## [1.6.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.6.0...v1.6.1) (2022-06-07)


### Bug Fixes

* should show Pending instead of Pendin ([0b93f80](https://github.com/ydb-platform/ydb-embedded-ui/commit/0b93f8000dffca27cd26321eb86f41e4f458faa6))
* should show query error even if no issues ([708bac5](https://github.com/ydb-platform/ydb-embedded-ui/commit/708bac56c2e671ec23e23c5055d0c0a9d419cd86))

## [1.6.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.5.3...v1.6.0) (2022-06-06)


### Features

* query issues displaying ([3ba4c25](https://github.com/ydb-platform/ydb-embedded-ui/commit/3ba4c2591542ef902eba4f7c44550f3c59618575))


### Bug Fixes

* code-review ([742c58a](https://github.com/ydb-platform/ydb-embedded-ui/commit/742c58a9bc4fa0dd0b24aa0119b7352e2be6fc8e))
* **package.json:** typecheck script ([111b525](https://github.com/ydb-platform/ydb-embedded-ui/commit/111b525f51a050010bbc03a3d0990be00c18ccd8))

### [1.5.3](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.5.2...v1.5.3) (2022-05-26)


### Bug Fixes

* explicitly set lang for ydb-ui-components i18n ([5684524](https://github.com/ydb-platform/ydb-embedded-ui/commit/5684524267e2cbf19a44de75b0e0b2bf98b617fd))
* proper icon size in uikit/Select ([a665d6d](https://github.com/ydb-platform/ydb-embedded-ui/commit/a665d6d829dae61ccf25566dd7b8cd1e46a743bb))
* update code for @yandex-cloud/uikit@^2.0.0 ([49d67a1](https://github.com/ydb-platform/ydb-embedded-ui/commit/49d67a1bddcba6fa138b5ebaeb280f16366b3329))


### chore

* update @yandex-cloud/uikit to 2.4.0 ([d2eb2e5](https://github.com/ydb-platform/ydb-embedded-ui/commit/d2eb2e5db147604ae346aea295ae22759712eaa4))
* add @yandex-cloud/uikit to peer deps ([9c9f599](https://github.com/ydb-platform/ydb-embedded-ui/commit/9c9f5997dcca1be5868d013da311a28e495e7faa))
* update ydb-ui-components to v2.0.1 ([3d6a8d3](https://github.com/ydb-platform/ydb-embedded-ui/commit/3d6a8d30ab2ab47203eb956904e891ae106c0bc7))

### [1.5.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.5.1...v1.5.2) (2022-05-26)


### Bug Fixes

* **Tenant:** always update diagnostics tabs for root ([db03266](https://github.com/ydb-platform/ydb-embedded-ui/commit/db03266fd7dd6e4588c1db0d109bdfaa8f693e2d))
* **Tenant:** don't use HistoryAPI and redux-location-state together ([c1bc562](https://github.com/ydb-platform/ydb-embedded-ui/commit/c1bc5621e3ead44b1b84e592f8d7106bbc918e37))

### [1.5.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.5.0...v1.5.1) (2022-05-25)


### Bug Fixes

* **Authentication:** submit form with enter in the login field ([7b6132a](https://github.com/ydb-platform/ydb-embedded-ui/commit/7b6132a6b2556939648167f30b08c5688b56ab98))

## [1.5.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.4.2...v1.5.0) (2022-05-24)


### Features

* **Healthcheck:** use TreeView in issues viewer ([bcd81e5](https://github.com/ydb-platform/ydb-embedded-ui/commit/bcd81e56dc613cf3e9f31d77d930b79e070372e4))
* **Tenant:** use NavigationTree for schemas ([f2867e1](https://github.com/ydb-platform/ydb-embedded-ui/commit/f2867e18898028ca265df46fcc8bfa4f929173f0))


### Bug Fixes

* **Healthcheck:** don't display reasonsItems in issues viewer ([f0a545f](https://github.com/ydb-platform/ydb-embedded-ui/commit/f0a545f7c70d449c121d64f8d1820e53b880a0fc))
* **Tenant:** add ellipsis to menu items inserting queries ([09135a2](https://github.com/ydb-platform/ydb-embedded-ui/commit/09135a2777ec9183ddf71bd2a4de66c5ef422ac8))
* **Tenant:** change messages for path copy toasts ([09adfa5](https://github.com/ydb-platform/ydb-embedded-ui/commit/09adfa52735bf706deb1ee9bf37f4bfa459b3758))
* **Tenant:** switch to query tab for inserted query ([991f156](https://github.com/ydb-platform/ydb-embedded-ui/commit/991f156ff819c58ff79146a44b57fb400729f325))

### [1.4.2](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.4.1...v1.4.2) (2022-05-23)


### UI Updates

* **QueryEditor:** replace warning for query losing with note about how query are saved ([89820ca](https://github.com/ydb-platform/ydb-embedded-ui/commit/89820ca7e2d02f880eb81d484b8947d599798d5f))


### Bug Fixes

* **QueryEditor:** confirm query deletion with enter ([d3dadbd](https://github.com/ydb-platform/ydb-embedded-ui/commit/d3dadbd0244fead5f41bd98445669c4f5ce23c43))
* **QueryEditor:** field autofocus in query save dialog ([9225238](https://github.com/ydb-platform/ydb-embedded-ui/commit/92252384dc68c40191f7898fff9a2c1106b0b2f1))
* **QueryEditor:** save query with enter ([5f9c450](https://github.com/ydb-platform/ydb-embedded-ui/commit/5f9c450aedc90f0e162515294a74000c006f9be7))

### [1.4.1](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.4.0...v1.4.1) (2022-05-17)


### UI Updates

* **Tenant:** add tenant name wrapper ([8176d28](https://github.com/ydb-platform/ydb-embedded-ui/commit/8176d28a5769b2b95d667ed960ad34d7a0d9bb4c))


### Bug Fixes

* **NodesTable:** align external link icon ([a379796](https://github.com/ydb-platform/ydb-embedded-ui/commit/a379796c6b8087f25f95ce3db4be33f18da71e04))

## [1.4.0](https://github.com/ydb-platform/ydb-embedded-ui/compare/v1.3.0...v1.4.0) (2022-05-16)


### Features

* **Tenant:** save initial tab preference ([7195d0f](https://github.com/ydb-platform/ydb-embedded-ui/commit/7195d0f7f5754c461555211515f80ea96464ca15))


### UI Updtaes

* **NodesTable:** don't reserve space for icons next to node fqdn ([8fcf1b3](https://github.com/ydb-platform/ydb-embedded-ui/commit/8fcf1b3269dee7ada83d7c5abcf44ad004191851))


### Bug Fixes

* **Tenant:** mapDispatchToProps types ([7dcaf56](https://github.com/ydb-platform/ydb-embedded-ui/commit/7dcaf561ec0c361d52d789b2ea3b1aba75339d83))

## [1.3.0](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.6...v1.3.0) (2022-05-12)


### Features

* **Storage:** red progress bars for unavailable disks ([17cf94d](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/17cf94defb23681bc62c768d3282eed00c7e974d))

### [1.2.6](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.5...v1.2.6) (2022-05-05)


### Bug Fixes

* code-review ([1068339](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/1068339d128fb44b661837b7d777b5e5f725a611))
* **Diagnostics:** layout ([2b11c35](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/2b11c35c14cd1fa17d36bbeb2a371fb2fef3fb70))

### [1.2.5](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.4...v1.2.5) (2022-05-05)


### Bug Fixes

* **Node:** right padding on the storage page ([3a09d80](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/3a09d8030c2b9d8f34675f3a790e19bba5b864e4))
* **Tenant:** fix horizontal scrollbar on diagnostics storage page ([017f5f3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/017f5f3470875824b11575c506837ab461a4e840))
* **Tenant:** keep acl heading at top ([7859fc6](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/7859fc6a2e47071daf18b48a23974f2393e31417))
* **Storage:** move filters out of scrollable container ([66baaec](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/66baaec170449c89da2d9f8e2170875c13334e68))
* **NodesViewer:** match default control styles ([c007674](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/c0076742e78fdb87aadae9b22e073b923e7ca57e))

### [1.2.4](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.3...v1.2.4) (2022-05-05)


### Bug Fixes

* **Storage:** make 2 argument in getStorageInfo optional ([e349f8b](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/e349f8b958756258b2d3790fbc9018c63b86498e))

### [1.2.3](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.2...v1.2.3) (2022-05-05)


### Bug Fixes

* **node reducer:** should specify concurrentId in getNodeStructure ([103c843](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/103c843524e21af421954444774d68bda540ceae))

### [1.2.2](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.1...v1.2.2) (2022-05-04)


### Bug Fixes

* code-review ([288fda3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/288fda3cd207908e9b5c0486c4d486c6f2e17dd4))
* reducer clusterInfo should not be used ([1cafcbf](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/1cafcbfb15f668b100cf6628b540b7cd234f6024))

### [1.2.1](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.2.0...v1.2.1) (2022-04-27)


### Bug Fixes

* **Vdisk:** should not fail if no node id passed ([d66686d](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/d66686d0cbd9f61c4e106f6775db2fca226c922f))

## [1.2.0](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.1.3...v1.2.0) (2022-04-26)


### Features

* **Storage:** smoother loading state for storage table ([f7f38c4](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/f7f38c455dd9abc3f898048081e90af9b460f922))


### Bug Fixes

* prevent ghost autofetch ([153d829](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/153d8291d315f1dab001a69981a12e30d3d2aea9))

### [1.1.3](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.1.2...v1.1.3) (2022-04-20)


### Bug Fixes

* should prepare internal link correctly ([3da36e2](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/3da36e22f6adbce6a1b14ac1afb0fb4aa46bb75f))

### [1.1.2](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.1.1...v1.1.2) (2022-04-19)


### Bug Fixes

* **ObjectSummary:** should correctly parse table creation time ([c9887dd](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/c9887dd162720667dcbe3b4834b3b0ba5a9f3f6e))

### [1.1.1](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.1.0...v1.1.1) (2022-04-19)


### Bug Fixes

* add typecheck + fix type errors ([e6d9086](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/e6d9086c46702a611f848c992377d18826ca2e23))
* **Node:** scroll to selected vdisk should not apply to undefined container ([7236a43](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/7236a43655b935777abb5b8df228ae011ceb6bed))

## [1.1.0](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.0.4...v1.1.0) (2022-04-15)


### Features

* local precommit check ([d5da9b3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/d5da9b3fb89eeeb5461e7e14fe33964a8ed9078d))
* new Node Structure view ([5cf5dd3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/5cf5dd39fa59625be4bb89f16796f16ecb9d9d78))


### Bug Fixes

* **Authentication:** should be able to send authentication data with empty password [YDB-1610] ([5d4d881](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/5d4d8810bb2ddabb9db1316a99194f5a1bd986b6))
* **Cluster:** should show additional info ([cb21ce3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/cb21ce317c55d05c7a7c166bc09dc1fe14e41692))
* code-review ([a706903](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/a706903e6a30ee62aff5829c37ba8c197335e106))
* different interface fixes ([0bd3a32](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/0bd3a32bf1502cc6d0f7419aa9d00653afe5d7bf))
* improve usability ([20f1acc](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/20f1acc255876968ea366a860d33a12eecc5e74f))
* **Nodes:** default path to node should be Overview ([ac4add6](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/ac4add6c1403ac2b9614f252fabf23b9e97ef2c2))
* query run type select should be styled as action button [YDB-1567] ([d06cd6a](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/d06cd6ac72ccb8c7eef205fddb1153e6383baeea))
* **QueryEditor:** should resolve row key by index [YDB-1604] ([4acd2a3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/4acd2a30d03f2e45368587839549f4e5981f93dd))
* refactoring ([0c5aca5](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/0c5aca5b96bc5d5e9c3f121aa1ffe394f3fbd28f))
* **Storage:** wording fixed [YDB-1552] ([431f77f](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/431f77f090073037404639c686246d2f115d98f4))
* styles ([2725055](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/2725055b0f25e711c73e2888da41cfaf2657b110))

### [1.0.4](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.0.3...v1.0.4) (2022-03-24)


### Bug Fixes

* freeze deps ([349dee8](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/349dee8cbc7376e316e3cb87f5eb46142975de6c))
* styles ([502bc0b](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/502bc0bd319a141e2d3e90787eae41abcd24e76d))

### [1.0.3](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.0.2...v1.0.3) (2022-03-21)


### Bug Fixes

* query status should not be shown when query is loading ([d214eee](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/d214eee575b63341082f0be33163e3fce520df88))
* should set correct initial current index in queries history ([c3228d7](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/c3228d7a6a0c810982db1bdbec7762889ac44ffa))
* **Storage:** wording fixed [YDB-1552] ([3f487ff](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/3f487ff01117963760b676d14281e93e5f3002c0))

### [1.0.2](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.0.1...v1.0.2) (2022-03-11)


### Bug Fixes

* **Header:** add link to internal viewer ([64af24f](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/64af24f8d78cf0d34466ac129be10c0764cce3d4))

### [1.0.1](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v1.0.0...v1.0.1) (2022-03-05)


### Bug Fixes

* **QueriesHistory:** should save history to local storage ([#8](https://www.github.com/ydb-platform/ydb-embedded-ui/issues/8)) ([57031ab](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/57031ab16900e9d1112bbf506d5c777f94f883bb))

## [1.0.0](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v0.2.0...v1.0.0) (2022-03-01)


### Bug Fixes

* **ObjectSummary:** start time should be taken from current schema object ([e7511be](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/e7511be61e5c8d2052ad3a2247a713f55049d3e6))
* **QueryEditor:** key bindings should work properly ([ebe59b3](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/ebe59b3c838889ee81e308232e4c8d2ba23a1a3a))
* **QueryExplain:** should render graph in fullscreen view properly ([da511da](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/da511da2fc1a36282ad99f20d5d6fd0b5b4ea05b))
* **README:** ui path should be correct ([e2668ef](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/e2668ef329de4cf31fd31061dfe3b4ac091e0121))

## [0.2.0](https://www.github.com/ydb-platform/ydb-embedded-ui/compare/v0.1.0...v0.2.0) (2022-02-24)


### Features

* new design, refactoring ([#3](https://www.github.com/ydb-platform/ydb-embedded-ui/issues/3)) ([76d7cb0](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/76d7cb0ebad5658a6654254a0376b1ecf203e696))

## 0.1.0 (2022-02-17)


### Features

* initial import ([9bf5e83](https://www.github.com/ydb-platform/ydb-embedded-ui/commit/9bf5e833e3d2d10897215f7d439b284a4c3c10df))

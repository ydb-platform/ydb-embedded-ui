# Changelog

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

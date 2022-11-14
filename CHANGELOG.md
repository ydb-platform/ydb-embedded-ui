# Changelog

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

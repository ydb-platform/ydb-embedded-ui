# Changelog

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

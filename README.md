# React Native Harmony Adapter Skill

一个面向 Codex 的可复用 Skill，用于将现有 React Native 项目适配到 HarmonyOS / OpenHarmony。

这套 Skill 不是凭空编写的说明文档，而是从一个真实的复杂业务项目迁移过程中沉淀出来的。它重点覆盖了 React Native + Expo Router 项目在鸿蒙适配中的高频问题，包括依赖盘点、Harmony 宿主工程接线、兼容层封装、Expo Router 稳定化、图标字体处理、自定义 TurboModule 桥接、启动白屏排查等。

当前版本还额外补充了相机专项适配经验，覆盖 `react-native-vision-camera` / `@react-native-ohos/react-native-vision-camera` 在 Harmony 下的预览初始化、`takePhoto()` 返回 `null`、`photoSession null`、`7400101`、`7400201`、CameraRoll 保存失败，以及 Bun 项目里如何持久化 ETS 补丁等问题。

同时还补充了图片上传与回显路径治理经验，覆盖 Harmony 下 `react-native-image-picker`、相册选择、页面回显、压缩、`RNFetchBlob` 上传时常见的 `file://`、`realPath`、`originalPath`、`media/Photo/...` 等路径差异问题。

## 这个 Skill 解决什么问题

在真实项目中，鸿蒙适配通常不是单个页面的问题，而是多层问题叠加：

- React Native 与 RNOH 版本基线不匹配
- Expo 运行时假设与 Harmony 宿主能力不一致
- 三方库虽然安装了，但宿主工程没有真正接线
- 导航依赖集合发生漂移
- 图标字体、启动资源和 Metro 连接问题交织出现
- 业务自定义模块需要桥接到 ArkTS / C++

这个 Skill 的目标，就是把这些“真实迁移里踩出来的路径”整理成可复用的方法。

## Skill 覆盖范围

这套 Skill 主要覆盖以下场景：

- 审计 React Native / Expo 项目的鸿蒙迁移风险
- 判断 RN / RNOH 的实际可用版本基线
- 搭建并检查独立的 `harmony/` 宿主工程
- 将不兼容的库替换为 Harmony 对应实现或 compat wrapper
- 稳定 Expo Router、`expo-linking` 与 `@react-navigation/*`
- 处理图标字体、`expo-font`、白框图标等问题
- 对项目自定义模块进行 TurboModule 桥接
- 提供脚本辅助做依赖扫描和 compat import 重写建议

## 适合什么项目

这套 Skill 特别适合以下类型项目：

- 已经上线的 React Native 业务项目
- 使用 Expo 或 Expo Router 的项目
- 含有多个原生依赖的跨端项目
- 含有自定义 Expo 模块或项目私有模块的项目
- 希望先做“可运行、可调试、可逐步收敛”的鸿蒙适配项目

## 仓库结构

```text
react-native-harmony-adapter/
├── SKILL.md
├── agents/openai.yaml
├── references/
└── scripts/
```

说明：

- `SKILL.md`：Skill 主入口，定义触发描述与基础工作流
- `agents/openai.yaml`：Skill 的 UI 元信息
- `references/`：按主题拆分的鸿蒙适配参考资料
- `scripts/`：依赖审计、compat import 扫描和重写建议脚本

## 已包含的关键参考主题

当前 Skill 中已整理了以下重点参考文档：

- Expo 项目在 Harmony 上的适配策略
- Expo Router 在 Harmony 上的导航与启动问题
- 图片/相册/上传路径在 Harmony 上的统一治理
- VisionCamera 在 Harmony 上的接线与排障
- 自定义 Expo 模块适配方法
- 自定义 TurboModule on Harmony
- 导航依赖集合治理
- 图标与字体注册问题
- 宿主工程接线清单
- 依赖替换矩阵
- compat import 映射建议

## 安装方式

### 方式 1：复制到本地 Codex skills 目录

将仓库中的 `react-native-harmony-adapter/` 目录复制到本地 `$CODEX_HOME/skills/`：

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R react-native-harmony-adapter "$CODEX_HOME/skills/"
```

### 方式 2：从仓库检出后软链接或复制

如果你通过 Git 克隆了本仓库，也可以把 skill 目录软链接到本地技能目录中。

## 推荐使用方式

示例提示词：

```text
Use $react-native-harmony-adapter to adapt this existing React Native project to HarmonyOS.
```

常见使用场景：

- “帮我审计这个 Expo 项目的 Harmony 迁移风险”
- “帮我为这个 RN 项目建立 Harmony 宿主工程”
- “帮我把不兼容的 Expo / Native 依赖收口到 compat wrapper”
- “帮我排查 Harmony 启动白屏和 Metro 连不上问题”
- “帮我把项目私有模块桥接成 Harmony TurboModule”

## 配套脚本

Skill 内置了一组配套脚本，适合用来做迁移前扫描和批量重构建议：

- `audit-harmony-deps.js`
- `generate-harmony-plan.js`
- `scan-compat-imports.js`
- `suggest-compat-rewrites.js`
- `apply-compat-rewrites.js`

这些脚本主要用于：

- 首轮依赖审计
- 迁移计划草案生成
- 高风险 import 路径扫描
- compat 重写建议生成

## 使用时需要注意

这套 Skill 是“实践型迁移 Skill”，不是官方兼容承诺。

在真正修改生产项目之前，仍然建议同步核对：

- RNOH 当前官方支持矩阵
- 目标三方库的 Harmony 官方文档
- 你的 RN / Expo / RNOH 实际版本组合

对于真实业务项目，建议始终遵循以下原则：

1. 单独建立 Harmony 分支
2. 优先打通宿主工程和启动链路
3. 优先建立 compat / service 层，而不是直接改业务页面
4. 先保主链路可用，再逐步收体验一致性

## 为什么把它做成 Skill

很多鸿蒙适配经验如果只停留在聊天记录、个人记忆或某一次项目里，后续很难复用。做成 Skill 之后，有几个明显好处：

- 新项目可以直接复用思路
- 同类问题可以快速对照排查
- 团队内部能沉淀统一工作方式
- 后续可以持续演进，而不是每个项目重新摸索

## 发布说明

本仓库已整理为可分享结构。发布或二次分发前，建议查看：

- `LICENSE`
- `PUBLISHING.md`
- `ANNOUNCEMENT.md`

## 来源说明

这套 Skill 来自一次真实的 React Native 业务项目鸿蒙适配实践，并在整理过程中做了通用化抽象，用于支持其他项目复用。

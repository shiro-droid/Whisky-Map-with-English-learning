# Whisky Map · 苏格兰威士忌地图（学英语）

用苏格兰威士忌学英语。手机优先的单页应用，无框架、无构建、无依赖，打开就能用。

姊妹项目：[Japan-map-with-Japanese-learning](https://github.com/shiro-droid/Japan-map-with-Japanese-learning)

## 怎么用

打开 `index.html`（或 GitHub Pages 地址）。每一场是一张场景图，图上的金色圆点是热点，点开一格：

1. **English first** — 先给一整段真实英语（5–8 句），可整段播放、慢速、逐句点读、中文折叠
2. **拆解** — 语言点、对话、词表（英 / 中 / 日三语）
3. **Checkpoint** — 当场一道题回收
4. 每场附一格 **本场笔记**（写作 + 自查清单 + 个人错题本）和一关 **过关**（听写词级比对 / 情境造句 / 改错）

进度和你写的笔记存在浏览器 localStorage 里，关掉再开能接上。首页有「导出我的笔记」，一键复制成 Markdown。

## 第一章 · 艾雷岛 Laphroaig（43 格）

| | 场景 | 英语重点 |
|---|---|---|
| 1 | Booking & Arrival 报到 | 正式邮件体 ↔ 口语落差、dreich / smirr、borrow ↔ lend |
| 2 | Floor Maltings & Kiln 发麦楼 | have a go、smoulder ≠ burn、**敢打断提问** |
| 3 | Mash, Wash & Spirit 蒸馏室 | too…to、**does 强调式**、数字（point / per cent / 15 ↔ 50） |
| 4 | Collecting Your Rent 泥煤地 | 完成时 vs 过去时、地貌词、**闲聊套路** |
| 5 | Tasting Room 品鉴室 | What are you getting? ↔ I get…、**说差别的语言**、SMWS 骨架 |

设计上有一条**跨场螺旋回收**：同一个说法在不同场景反复出现，不背，靠撞。
`that's you sorted / checked in / paid up`（3 次）、`mind`（4 次）、苏格兰否定 `you'll not`（3 次）、
`What … is …` 强调框架、`too … to …`、`比较级 + than you'd think`。

## 文件结构

```
index.html                入口页：五场进度汇总 + 导出全部笔记
wm.css / wm.js            共享引擎（TTS、段落、checkpoint、笔记、过关、进度、弹层）
laphroaig-1-arrival.html  段 1 报到
laphroaig-2-malting.html  段 2 发麦楼
laphroaig-3-stills.html   段 3 蒸馏室
laphroaig-4-plot.html     段 4 领地租
laphroaig-5-tasting.html  段 5 品鉴室
```

新增一场只需写场景 SVG + `SPOTS` 数组，然后调用 `WM.boot(config)`。
`{notes:{…}}` 和 `{outro:true}` 两格由引擎自动生成。

## 技术说明

- **音频**：目前全部使用浏览器 `speechSynthesis`（iOS 上是 Daniel，标准英音，**没有苏格兰口音**）。数据结构预留了 `audio` 字段，后续可为关键句配真人音频。
- **需要系统装有英语语音**。检测不到英语语音时会显示提示并停用朗读——绝不用中文引擎去念英文（那会把发音带偏）。
  - Windows：设置 → 时间和语言 → 语言和区域 → 添加 **English (United Kingdom)**，勾选「语音」「文本转语音」，装完重启浏览器。
  - iPhone / iPad：系统自带，无需设置。
- **改了 `wm.css` / `wm.js` 记得把各 HTML 里的 `?v=` 版本号加一**，否则手机端会用缓存的旧版本。
- **录音跟读**：用 `MediaRecorder` 录音回放对比。iOS Safari 不支持语音识别 API，所以没有自动打分。**需要 https**——本地 `file://` 拿不到麦克风。
- **建议**：iPhone Safari → 分享 → 添加到主屏幕，全屏使用。

## 接下来

- 艾雷岛全图（渡轮 · Port Ellen · 南岸三雄 · Bowmore 的 pub · 北岸 · Fèis Ìle）
- 第二章 爱丁堡（SMWS 28 Queen Street / The Vaults · 出差与同事社交英语）

## 版权

村上春树《如果我们的语言是威士忌》、土屋守《威士忌大全》等书仅作短句引用并标注出处。
SMWS 风格的品鉴笔记为仿写示例，非原文引用。

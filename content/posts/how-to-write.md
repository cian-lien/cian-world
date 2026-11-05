---
title: 文章写法说明（给未来的自己）
date: 2026-10-20
tags: [说明]
summary: 新建一篇日记只需要往 content/posts 里放一个 .md 文件。
---

在 `content/posts/` 下新建一个 `.md` 文件，**文件名就是文章的网址**。比如 `my-first-post.md` 对应 `#/diary/my-first-post`。

文件开头写上这样一段 frontmatter：

```md
---
title: 文章标题
date: 2026-11-01
tags: [标签1, 标签2]
summary: 一句话简介
draft: false
---
```

- `date` 用来排序，越新越靠前
- `draft: true` 的文章不会显示
- 图片放进 `public/images/`，正文里写 `![说明](/images/xxx.png)`

// 站点个人信息：电脑桌面里的「关于我」「我的项目」「浏览器书签」都读这里。改成你自己的就行。

export const site = {
  name: 'Cian Lien',
  title: 'Cian Lien’s World',
  avatar: '🧑‍💻',
  role: '全栈开发工程师',
  bio: '前端出身，正在系统地补后端。喜欢做有意思的网页，这里收藏我的作品、文章与生活记录。',
  location: '广州',
  skills: ['TypeScript', 'React', 'Three.js', 'Node.js', 'SQL', 'Blender'],

  projects: [
    {
      name: 'Cian Lien’s World',
      desc: '从一间 3D 房间开始的个人世界，展示我的作品、个人介绍与文章。',
      tech: ['R3F', 'Three.js', 'Blender', 'Markdown'],
      url: 'https://github.com/',
    },
    {
      name: '示例项目 B',
      desc: '在这里写一句话介绍你的项目，比如它解决了什么问题。',
      tech: ['Node.js', 'PostgreSQL'],
      url: 'https://github.com/',
    },
    {
      name: '示例项目 C',
      desc: '可以放公司项目的脱敏版介绍，或者自己的练手项目。',
      tech: ['Vue', 'Express'],
      url: '',
    },
  ],

  // 「浏览器」里的书签。很多网站（GitHub、知乎等）禁止被 iframe 嵌入，所以这里统一在新标签页打开。
  links: [
    { name: 'GitHub', icon: '🐙', url: 'https://github.com/' },
    { name: '掘金', icon: '💎', url: 'https://juejin.cn/' },
    { name: 'Three.js', icon: '🧊', url: 'https://threejs.org/' },
    { name: '邮箱', icon: '✉️', url: 'mailto:you@example.com' },
  ],
}

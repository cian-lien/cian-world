// 站点个人信息：电脑桌面里的「关于我」「我的项目」「浏览器书签」都读这里。改成你自己的就行。

export const site = {
  name: 'Your Name',
  avatar: '🧑‍💻',
  role: '全栈开发工程师',
  bio: '前端出身，正在系统地补后端。喜欢做有意思的网页，这个 3D 房间就是我的博客。',
  location: '广州',
  skills: ['TypeScript', 'React', 'Three.js', 'Node.js', 'SQL', 'Blender'],

  projects: [
    {
      name: '3D 房间博客',
      desc: '你现在看到的这个网站。React Three Fiber + Blender，日记本里是我的博客文章。',
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

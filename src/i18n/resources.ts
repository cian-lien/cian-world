import {zhRooftop,enRooftop} from './rooftop'
import { zhEnvironment, enEnvironment } from './environment'
export const zhCN = {
  environment: zhEnvironment,
  rooftop:zhRooftop,
  language: { label: '语言' },
  hud: {
    nightMode: '夜景模式', day: '日景', night: '夜景', back: '返回房间', computer: '电脑',
    hint: '点点房间里的东西：日记本、电脑、台灯，还有猫 🐾 · 拖动可以转动视角',
    mobile: '点按房间里的物件进行探索', roomLoadError: '房间暂时无法加载。',
  },
  scene: {
    diary: '📔 日记本 · 看看我的博客', computer: '💻 电脑 · 打开看看',
    lampOff: '💡 关灯', lampOn: '💡 开灯', cat: '🐱 摸摸猫', meow: '喵～',
    loading: '正在布置房间 {{progress}}%',
  },
  diary: {
    title: '日记本', count: '共 {{count}} 篇', count_one: '共 {{count}} 篇', count_other: '共 {{count}} 篇',
    missing: '这一页被撕掉了……找不到「{{slug}}」。', welcome: '欢迎翻开我的日记本',
    intro: '左边是目录，点一篇开始读吧。', latest: '最新：{{title}} →', close: '合上日记本',
    originalLanguage: '文章原文为中文。',
  },
  desktop: {
    about: '关于我.txt', projects: '我的项目', browser: '浏览器', terminal: '终端', blog: '日记本',
    close: '关闭', leave: '离开电脑', view: '查看 ↗',
    bookmarks: '书签会在新标签页打开（大多数网站禁止被嵌入到别的页面里）。', terminalInput: '终端命令',
  },
  terminal: {
    greeting: 'RoomOS 终端 v0.1 —— 输入 help 查看命令',
    help: '显示这份帮助', whoami: '我是谁', ls: '列出所有日记', cat: '打开第 N 篇日记',
    projects: '我的项目', date: '现在几点', clear: '清屏', exit: '离开电脑',
    empty: '（还没有日记）', opening: '正在打开《{{title}}》……',
    usage: '用法：cat <编号>，先用 ls 看看编号', denied: '权限不足：这是我的房间 😼',
    unknown: '找不到命令：{{command}}（输入 help 看看）',
  },
} as const

type TranslationShape<T> = { [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]> }

export const en = {
  environment: enEnvironment,
  rooftop:enRooftop,
  language: { label: 'Language' },
  hud: {
    nightMode: 'Night mode', day: 'Day', night: 'Night', back: 'Back to room', computer: 'Computer',
    hint: 'Explore the diary, computer, lamp, and cat 🐾 · Drag to look around',
    mobile: 'Tap objects to explore the room.', roomLoadError: 'The room could not load.',
  },
  scene: {
    diary: '📔 Diary · Read my blog', computer: '💻 Computer · Take a look',
    lampOff: '💡 Turn off the lamp', lampOn: '💡 Turn on the lamp', cat: '🐱 Pet the cat', meow: 'Meow~',
    loading: 'Setting up the room {{progress}}%',
  },
  diary: {
    title: 'Diary', count: '{{count}} entries', count_one: '{{count}} entry', count_other: '{{count}} entries',
    missing: 'This page seems to be missing… Could not find “{{slug}}”.', welcome: 'Welcome to my diary',
    intro: 'Pick an entry on the left to start reading.', latest: 'Latest: {{title}} →', close: 'Close the diary',
    originalLanguage: 'Articles are currently available in Chinese.',
  },
  desktop: {
    about: 'About me.txt', projects: 'My projects', browser: 'Browser', terminal: 'Terminal', blog: 'Diary',
    close: 'Close', leave: 'Leave computer', view: 'View ↗',
    bookmarks: 'Bookmarks open in a new tab (most websites do not allow embedding).', terminalInput: 'Terminal command',
  },
  terminal: {
    greeting: 'RoomOS Terminal v0.1 — Type help for commands',
    help: 'Show this help', whoami: 'Who I am', ls: 'List all diary entries', cat: 'Open diary entry N',
    projects: 'My projects', date: 'Current date and time', clear: 'Clear the screen', exit: 'Leave the computer',
    empty: '(No diary entries yet)', opening: 'Opening “{{title}}”…',
    usage: 'Usage: cat <number>. Use ls to see entry numbers.', denied: 'Permission denied: this is my room 😼',
    unknown: 'Command not found: {{command}} (type help for commands)',
  },
} satisfies TranslationShape<typeof zhCN>

export const resources = { 'zh-CN': { translation: zhCN }, en: { translation: en } }

import type { Season } from './types'

type Bilingual = { 'zh-CN': string; en: string }
export interface SolarTermMetadata {
  index: number; id: string; name: Bilingual; season: Season; longitude: number
  copy: Bilingual; visualThemeId: string; soundThemeId: string
}
const rows = [
  ['lichun','立春','Start of Spring (Lìchūn)','梅花开了，新芽在等一场暖风。','Plum blossoms open; new buds await a warmer breeze.'],
  ['yushui','雨水','Rain Water (Yǔshuǐ)','草木苏醒，春意慢慢舒展。','Plants awaken as spring slowly unfolds.'],
  ['jingzhe','惊蛰','Awakening of Insects (Jīngzhé)','泥土里的小生命，开始探头。','Small lives begin to stir beneath the soil.'],
  ['chunfen','春分','Spring Equinox (Chūnfēn)','昼夜相迎，枝头添了一点绿。','Day and night meet; branches gain a little green.'],
  ['qingming','清明','Pure Brightness (Qīngmíng)','柳枝轻垂，风筝把心事带远。','Willow branches trail softly; a kite carries thoughts away.'],
  ['guyu','谷雨','Grain Rain (Gǔyǔ)','春将尽，草木正忙着生长。','As spring draws to a close, greenery keeps growing.'],
  ['lixia','立夏','Start of Summer (Lìxià)','树荫渐浓，夏天走进小院。','Shade deepens as summer enters the little garden.'],
  ['xiaoman','小满','Grain Buds (Xiǎomǎn)','小满未满，日子还有生长的余地。','Almost full: there is still room for the days to grow.'],
  ['mangzhong','芒种','Grain in Ear (Mángzhòng)','田野忙碌，草叶也伸长了腰。','Fields grow busy, and grass stretches a little taller.'],
  ['xiazhi','夏至','Summer Solstice (Xiàzhì)','北半球白昼最长，荷花与萤火相伴。','The Northern Hemisphere’s longest day brings lotus flowers and fireflies.'],
  ['xiaoshu','小暑','Minor Heat (Xiǎoshǔ)','找一片树荫，听一会儿夏虫。','Find a patch of shade and listen to summer insects.'],
  ['dashu','大暑','Major Heat (Dàshǔ)','浓荫与荷叶，收藏盛夏的光。','Deep shade and lotus leaves gather the light of midsummer.'],
  ['liqiu','立秋','Start of Autumn (Lìqiū)','第一片落叶，捎来秋天的消息。','The first fallen leaf carries a message from autumn.'],
  ['chushu','处暑','End of Heat (Chǔshǔ)','暑意渐远，叶色悄悄转柔。','Summer heat recedes as leaf colours soften.'],
  ['bailu','白露','White Dew (Báilù)','草尖微亮，秋意落在叶边。','Grass tips gleam; autumn settles along the leaves.'],
  ['qiufen','秋分','Autumn Equinox (Qiūfēn)','昼夜相迎，树叶换上浅金。','Day and night meet as leaves turn pale gold.'],
  ['hanlu','寒露','Cold Dew (Hánlù)','枝叶渐疏，小路多了一点安静。','Branches thin, and the little path grows quieter.'],
  ['shuangjiang','霜降','Frost’s Descent (Shuāngjiàng)','秋叶将尽，留一抹温柔的褐色。','The last autumn leaves hold a gentle shade of brown.'],
  ['lidong','立冬','Start of Winter (Lìdōng)','枝头收起绿意，等一盏暖灯。','Branches set their green aside and wait for a warm light.'],
  ['xiaoxue','小雪','Minor Snow (Xiǎoxuě)','冬的日历翻开，静听窗外此刻。','Winter’s calendar opens; listen to the world outside today.'],
  ['daxue','大雪','Major Snow (Dàxuě)','树影清瘦，把温暖留在窗边。','Bare tree shadows keep a little warmth by the window.'],
  ['dongzhi','冬至','Winter Solstice (Dōngzhì)','门前挂灯笼，等北半球白昼渐长。','Lanterns glow by the door as Northern Hemisphere days begin to lengthen.'],
  ['xiaohan','小寒','Minor Cold (Xiǎohán)','枝头静静的，屋里留着暖光。','Branches rest quietly while warm light fills the room.'],
  ['dahan','大寒','Major Cold (Dàhán)','岁末的枝头，藏着下一场春意。','Year-end branches hold the promise of another spring.'],
] as const
const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']
export const solarTerms: readonly SolarTermMetadata[] = rows.map(([id, zh, en, zhCopy, enCopy], index) => ({
  index, id, name: { 'zh-CN': zh, en }, copy: { 'zh-CN': zhCopy, en: enCopy },
  season: seasons[Math.floor(index / 6)], longitude: (315 + index * 15) % 360,
  visualThemeId: id, soundThemeId: seasons[Math.floor(index / 6)],
}))

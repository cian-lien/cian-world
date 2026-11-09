// Independently transcribed 2026-11-08, HKT = UTC+08:00 (Asia/Shanghai).
// All 48 dates: https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf
//               https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2027e.pdf
// 12 major terms/year with times (NOT all 24 terms):
// https://www.hko.gov.hk/en/gts/astron2026/files/2026SolarTerms24.pdf
// https://www.hko.gov.hk/en/gts/astron2027/files/2027SolarTerms24.pdf
export const hkoDates: Record<number, readonly string[]> = {
  2026: ['01-05','01-20','02-04','02-18','03-05','03-20','04-05','04-20','05-05','05-21','06-05','06-21','07-07','07-23','08-07','08-23','09-07','09-23','10-08','10-23','11-07','11-22','12-07','12-22'],
  2027: ['01-05','01-20','02-04','02-19','03-06','03-21','04-05','04-20','05-06','05-21','06-06','06-21','07-07','07-23','08-08','08-23','09-08','09-23','10-08','10-23','11-07','11-22','12-07','12-22'],
}
export const hkoMajorTimes: Record<number, readonly string[]> = {
  2026: ['01-20T09:45','02-18T23:52','03-20T22:46','04-20T09:39','05-21T08:37','06-21T16:25','07-23T03:13','08-23T10:19','09-23T08:05','10-23T17:38','11-22T15:23','12-22T04:50'],
  2027: ['01-20T15:30','02-19T05:33','03-21T04:25','04-20T15:18','05-21T14:18','06-21T22:11','07-23T09:05','08-23T16:14','09-23T14:02','10-23T23:33','11-22T21:16','12-22T10:42'],
}

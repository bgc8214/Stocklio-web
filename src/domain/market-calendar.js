const DAY_MS = 24 * 60 * 60 * 1000;

export function getUsMarketContextForSeoulDate(seoulDateKey = dateKeyInTimeZone(new Date(), "Asia/Seoul")) {
  const referenceUsDate = addDays(seoulDateKey, -1);
  const latestTradingDate = getLatestUsMarketTradingDay(referenceUsDate);
  const holidayName = getNyseHolidayName(referenceUsDate);
  const weekend = isWeekend(referenceUsDate);
  const isTradingDay = latestTradingDate === referenceUsDate;
  return {
    market: "US",
    seoulDate: seoulDateKey,
    referenceUsDate,
    latestTradingDate,
    isTradingDay,
    isMarketClosed: !isTradingDay,
    closedReason: isTradingDay ? "" : holidayName || (weekend ? "주말" : "휴장일"),
    label: isTradingDay ? "미국장 마감 기준" : `${holidayName || (weekend ? "주말" : "휴장일")} · ${latestTradingDate} 종가 기준`,
  };
}

export function isUsMarketTradingDay(dateKey) {
  return !isWeekend(dateKey) && !getNyseHolidayName(dateKey);
}

export function getLatestUsMarketTradingDay(dateKey) {
  let cursor = dateKey;
  for (let guard = 0; guard < 14; guard += 1) {
    if (isUsMarketTradingDay(cursor)) {
      return cursor;
    }
    cursor = addDays(cursor, -1);
  }
  return dateKey;
}

export function getNyseHolidayName(dateKey) {
  const year = Number(dateKey.slice(0, 4));
  const holidays = getNyseHolidays(year);
  return holidays.get(dateKey) || "";
}

export function getPriceDateInUsMarket(asOf) {
  if (!asOf) {
    return "";
  }
  const date = new Date(asOf);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return dateKeyInTimeZone(date, "America/New_York");
}

export function isUsPriceFreshForContext(asOf, context) {
  if (!context?.latestTradingDate) {
    return true;
  }
  const priceDate = getPriceDateInUsMarket(asOf);
  return priceDate === context.latestTradingDate;
}

export function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return toDateKey(new Date(date.getTime() + days * DAY_MS));
}

export function dateKeyInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getNyseHolidays(year) {
  const holidays = new Map();
  const add = (dateKey, name) => holidays.set(dateKey, name);
  add(observedFixedHoliday(year, 1, 1), "New Year's Day");
  add(nthWeekdayOfMonth(year, 1, 1, 3), "Martin Luther King Jr. Day");
  add(nthWeekdayOfMonth(year, 2, 1, 3), "Presidents Day");
  add(addDays(easterDateKey(year), -2), "Good Friday");
  add(lastWeekdayOfMonth(year, 5, 1), "Memorial Day");
  add(observedFixedHoliday(year, 6, 19), "Juneteenth");
  add(observedFixedHoliday(year, 7, 4), "Independence Day");
  add(nthWeekdayOfMonth(year, 9, 1, 1), "Labor Day");
  add(nthWeekdayOfMonth(year, 11, 4, 4), "Thanksgiving Day");
  add(observedFixedHoliday(year, 12, 25), "Christmas Day");
  return holidays;
}

function observedFixedHoliday(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  if (weekday === 0) {
    return toDateKey(new Date(Date.UTC(year, month - 1, day + 1)));
  }
  if (weekday === 6) {
    return toDateKey(new Date(Date.UTC(year, month - 1, day - 1)));
  }
  return toDateKey(date);
}

function nthWeekdayOfMonth(year, month, weekday, nth) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return toDateKey(new Date(Date.UTC(year, month - 1, 1 + offset + (nth - 1) * 7)));
}

function lastWeekdayOfMonth(year, month, weekday) {
  const last = new Date(Date.UTC(year, month, 0));
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return toDateKey(new Date(Date.UTC(year, month - 1, last.getUTCDate() - offset)));
}

function easterDateKey(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toDateKey(new Date(Date.UTC(year, month - 1, day)));
}

function isWeekend(dateKey) {
  const weekday = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

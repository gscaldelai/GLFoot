// ════════════════════════════════════════════════════════
//  GLfoot — Catálogo de Troféus por Clube
// ════════════════════════════════════════════════════════

export interface TrophyEntry {
  title: string
  short: string
  years: number[]
}

export const CLUB_TROPHIES: Record<string, TrophyEntry[]> = {
  spfc: [
    { title: 'Brasileirão',      short: 'BRA', years: [1977, 1986, 1987, 1992, 2006, 2007, 2008] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [1992] },
    { title: 'Libertadores',     short: 'LIB', years: [1974, 1992, 2005] },
    { title: 'Mundial',          short: 'MUN', years: [1992, 2005] },
    { title: 'Supercopa BR',     short: 'SUP', years: [1993] },
    { title: 'Paulistão',        short: 'PAU', years: [1975, 1980, 1981, 1987, 1992, 1998, 2000, 2005, 2021, 2024] },
  ],
  palm: [
    { title: 'Brasileirão',      short: 'BRA', years: [1960, 1967, 1969, 1972, 1973, 1993, 1994] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [1998, 2012, 2015, 2020, 2023] },
    { title: 'Libertadores',     short: 'LIB', years: [1999, 2020, 2021] },
    { title: 'Paulistão',        short: 'PAU', years: [1959, 1963, 1966, 1972, 1974, 1976, 1993, 1994, 1996, 2008, 2020, 2022, 2023, 2024] },
  ],
  cor: [
    { title: 'Brasileirão',      short: 'BRA', years: [1990, 1998, 1999, 2005, 2011, 2015, 2017, 2023] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [2002, 2009] },
    { title: 'Libertadores',     short: 'LIB', years: [2012] },
    { title: 'Mundial',          short: 'MUN', years: [2000, 2012] },
    { title: 'Paulistão',        short: 'PAU', years: [1977, 1979, 1995, 1997, 1999, 2001, 2003, 2009, 2013, 2017, 2018, 2019] },
  ],
  san: [
    { title: 'Brasileirão',      short: 'BRA', years: [1961, 1962, 1963, 1964, 1965, 1968] },
    { title: 'Libertadores',     short: 'LIB', years: [1962, 1963] },
    { title: 'Mundial',          short: 'MUN', years: [1962, 1963] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [2010] },
    { title: 'Paulistão',        short: 'PAU', years: [1955, 1956, 1958, 1960, 1961, 1962, 1964, 1965, 1967, 1968, 1969, 1973, 1978, 1984, 2006, 2007, 2010, 2011, 2012, 2015, 2016] },
  ],
  fla: [
    { title: 'Brasileirão',      short: 'BRA', years: [1980, 1982, 1983, 1987, 1992, 2009, 2019, 2020] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [1990, 2006, 2013, 2022] },
    { title: 'Libertadores',     short: 'LIB', years: [1981, 2019, 2022] },
    { title: 'Supercopa BR',     short: 'SUP', years: [2020, 2021] },
  ],
  bot: [
    { title: 'Brasileirão',      short: 'BRA', years: [1968, 1995] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [] },
    { title: 'Cariocão',         short: 'CAR', years: [1948, 1957, 1961, 1962, 1967, 1968] },
  ],
  vas: [
    { title: 'Brasileirão',      short: 'BRA', years: [1974, 1989, 1997, 2000] },
    { title: 'Libertadores',     short: 'LIB', years: [1998] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [2011] },
  ],
  gre: [
    { title: 'Brasileirão',      short: 'BRA', years: [1981, 1996] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [1989, 1994, 1997, 2001, 2016] },
    { title: 'Libertadores',     short: 'LIB', years: [1983, 1995, 2017] },
    { title: 'Mundial',          short: 'MUN', years: [1983] },
  ],
  int: [
    { title: 'Brasileirão',      short: 'BRA', years: [1975, 1976, 1979] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [1992] },
    { title: 'Libertadores',     short: 'LIB', years: [2006, 2010] },
    { title: 'Mundial',          short: 'MUN', years: [2006] },
  ],
  atl: [
    { title: 'Brasileirão',      short: 'BRA', years: [1971, 2021] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [2014] },
    { title: 'Libertadores',     short: 'LIB', years: [2013] },
    { title: 'Copa Sul-Am.',     short: 'CSA', years: [2021] },
    { title: 'Supercopa BR',     short: 'SUP', years: [2022] },
  ],
  cru: [
    { title: 'Brasileirão',      short: 'BRA', years: [1966, 2003, 2013, 2014] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [1993, 1996, 2000, 2003, 2018] },
    { title: 'Libertadores',     short: 'LIB', years: [1976, 1997] },
  ],
  ame: [
    { title: 'Copa do Brasil',   short: 'CB',  years: [2022] },
    { title: 'Brasileirão Série B', short: 'B', years: [1997, 2017] },
  ],
  cap: [
    { title: 'Copa do Brasil',   short: 'CB',  years: [2019, 2021] },
    { title: 'Copa Sul-Am.',     short: 'CSA', years: [2018, 2021] },
  ],
  for: [
    { title: 'Copa do NE',       short: 'CNE', years: [2019, 2022] },
    { title: 'Copa Sul-Am.',     short: 'CSA', years: [2023] },
    { title: 'Brasileirão Série B', short: 'B', years: [2018] },
  ],
  bah: [
    { title: 'Brasileirão',      short: 'BRA', years: [1959, 1988] },
    { title: 'Copa do NE',       short: 'CNE', years: [2001, 2002] },
  ],
  spo: [
    { title: 'Brasileirão',      short: 'BRA', years: [1987] },
    { title: 'Copa do NE',       short: 'CNE', years: [1994, 2000] },
  ],
  goi: [
    { title: 'Brasileirão Série B', short: 'B', years: [1999, 2006, 2012, 2020] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [] },
  ],
  bra: [
    { title: 'Brasileirão Série B', short: 'B', years: [1990, 2018] },
  ],
  cru2: [
    { title: 'Copa do NE',       short: 'CNE', years: [1994, 2015] },
    { title: 'Copa do Brasil',   short: 'CB',  years: [] },
  ],
  csa: [
    { title: 'Brasileirão Série B', short: 'B', years: [2018] },
  ],
}

export function countTrophies(clubId: string): number {
  return (CLUB_TROPHIES[clubId] ?? [])
    .reduce((sum, t) => sum + t.years.length, 0)
}

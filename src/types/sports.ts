export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface SportsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: Market[];
  }[];
}

export interface BetSelection {
  eventId: string;
  eventTitle: string;
  selection: string;
  odds: number;
  marketKey: string;
  sportKey: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
}

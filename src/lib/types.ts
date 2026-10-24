export type Band = "High" | "Medium" | "Low";

export type Score = { score: number; band: Band };

export type Source = { label: string; url: string };

export type Problem = { text: string; source: number | null };

export type Similar = {
  name: string;
  similarity: number;
  problems: string[];
  source: number | null;
};

export type FdaItem = { kind: string; text: string; source: number | null };

export type Trials = {
  total: number;
  search: number | null;
  examples: { title: string; why: string; source: number | null }[];
};

export type Card = {
  id: string;
  name: string;
  info: number | null;
  chembl: number | null;
  scores: { liver: Score; heart: Score };
  own_problems: Problem[];
  similar: Similar[];
  fda: FdaItem[];
  trials: Trials | null;
  sources: Source[];
  summary: string | null;
};

export type IndexEntry = { id: string; name: string; names: string[] };

export type TrackedShow = {
  id: string;
  title: string;
  season: number;
  minEpisode: number;
  additionalQuery?: string;
  library: string;
  indexer?: string;
  category?: string;
};

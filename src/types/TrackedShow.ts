export type TrackedShow = {
  id: string;
  title: string;
  season: number;
  minEpisode: number;
  searchQuery?: string;
  library: string;
  indexer?: string;
  category?: string;
};

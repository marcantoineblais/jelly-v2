export type LastEpisode = {
  season: number;
  episode: number;
};

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatSeasonPath(season: number): string {
  if (season === 0) return "Specials";
  return `Season ${pad2(season)}`;
}

export function formatSearchQuery({
  title,
  season,
  episode,
  additionalQuery,
}: {
  title: string;
  season: number;
  episode: number;
  additionalQuery?: string;
}): string {
  return `${title} S${pad2(season)}E${pad2(episode)} ${additionalQuery ?? ""}`;
}

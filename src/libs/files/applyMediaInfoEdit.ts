import type { MediaFile } from "@/src/types/MediaFile";
import type { MediaInfo } from "@/src/types/MediaInfo";
import type { MediaLibrary } from "@/src/types/MediaLibrary";

export type MediaEditFormData = {
  title: string;
  useOriginalName: boolean;
  isSeasonEnabled: boolean;
  season: number | null;
  isEpisodeEnabled: boolean;
  episode: number | null;
  incrementEpisodes: boolean;
  isYearEnabled: boolean;
  year: number | null;
  library: string | undefined;
};

export const EMPTY_MEDIA_EDIT_FORM: MediaEditFormData = {
  title: "",
  useOriginalName: false,
  isSeasonEnabled: false,
  season: null,
  isEpisodeEnabled: false,
  episode: null,
  incrementEpisodes: false,
  isYearEnabled: false,
  year: null,
  library: undefined,
};

/**
 * Applies the edit form to one file. `index` is the file's position among
 * the edited files, used when episodes are incremented.
 */
export function applyMediaInfoEdit(
  file: MediaFile,
  form: MediaEditFormData,
  libraries: MediaLibrary[],
  index = 0,
): { mediaInfo: MediaInfo; library: MediaLibrary } {
  const mediaInfo: MediaInfo = { ...file.mediaInfo };

  if (form.useOriginalName) mediaInfo.title = file.name;
  else if (form.title) mediaInfo.title = form.title.trim();

  if (!form.isSeasonEnabled) mediaInfo.season = undefined;
  else if (form.season != null) mediaInfo.season = form.season;

  if (!form.isEpisodeEnabled) mediaInfo.episode = undefined;
  else if (form.episode != null)
    mediaInfo.episode = form.episode + (form.incrementEpisodes ? index : 0);

  if (!form.isYearEnabled) mediaInfo.year = undefined;
  else if (form.year != null) mediaInfo.year = form.year;

  const library =
    (form.library &&
      libraries.find((candidate) => candidate.name === form.library)) ||
    file.library;

  return { mediaInfo, library };
}

/** Pre-fills the form from the files being edited (shared values only). */
export function createMediaEditForm(files: MediaFile[]): MediaEditFormData {
  const first = files[0];
  if (!first) return EMPTY_MEDIA_EDIT_FORM;

  const shared = <T>(get: (file: MediaFile) => T) =>
    files.every((file) => get(file) === get(first)) ? get(first) : undefined;

  return {
    ...EMPTY_MEDIA_EDIT_FORM,
    title: shared((f) => f.mediaInfo.title) ?? "",
    season: shared((f) => f.mediaInfo.season) ?? null,
    episode: shared((f) => f.mediaInfo.episode) ?? null,
    year: shared((f) => f.mediaInfo.year) ?? null,
    library: shared((f) => f.library.name) || undefined,
    isSeasonEnabled: files.some((f) => f.mediaInfo.season !== undefined),
    isEpisodeEnabled: files.some((f) => f.mediaInfo.episode !== undefined),
    isYearEnabled: files.some((f) => f.mediaInfo.year !== undefined),
  };
}

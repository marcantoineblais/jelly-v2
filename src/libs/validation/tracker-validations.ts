const validateShow = (show: unknown) => {
  if (!show) return "Show is required";
  if (typeof show !== "string") return "Show must be a string";
  return null;
};

const validateNextEpisode = (nextEpisode: unknown) => {
  if (nextEpisode === undefined) return "Next episode is required";
  if (typeof nextEpisode !== "number") return "Next episode must be a number";
  if (isNaN(nextEpisode) || nextEpisode < 1)
    return "Next episode must be a positive number";
  if (!Number.isInteger(nextEpisode)) return "Next episode must be an integer";
  return null;
};

const validateTitle = (title: unknown) => {
  if (typeof title !== "string") return "Title must be a string";
  if (!title) return "Title is required";
  return null;
};

const validateSeason = (season: unknown) => {
  if (season === undefined) return "Season is required";
  if (typeof season !== "number") return "Season must be a number";
  if (isNaN(season) || season < 0) return "Season must be a positive number";
  if (!Number.isInteger(season)) return "Season must be an integer";
  return null;
};

const validateMinEpisode = (minEpisode: unknown) => {
  if (!minEpisode) return null;

  if (typeof minEpisode !== "number") return "Min episode must be a number";
  if (isNaN(minEpisode) || minEpisode < 0)
    return "Min episode must be a positive number";
  if (!Number.isInteger(minEpisode)) return "Min episode must be an integer";
  return null;
};

const validateLibrary = (library: unknown) => {
  if (typeof library !== "string") return "Library must be a string";
  if (!library) return "Library is required";
  return null;
};

const validationsMap: Record<string, (value: unknown) => string | null> = {
  show: validateShow,
  nextEpisode: validateNextEpisode,
  title: validateTitle,
  season: validateSeason,
  minEpisode: validateMinEpisode,
  library: validateLibrary,
};

export function validateFormData(data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const entries = Object.entries(data);
  entries.forEach(([key, value]) => {
    const validationFunc = validationsMap[key];
    if (validationFunc) {
      const error = validationFunc(value as string);
      if (error) errors[key] = error;
    }
  });
  return errors;
}

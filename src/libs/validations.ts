const validateTitle = (title: unknown) => {
  if (typeof title !== "string") return "Title must be a string";
  if (!title) return "Title is required";
  return null;
};

const validateSeason = (season: unknown) => {
  if (typeof season !== "number") return "Season must be a number";
  if (!season) return "Season is required";
  if (isNaN(season) || season < 1) return "Season must be a positive number";
  if (!Number.isInteger(season)) return "Season must be an integer";
  return null;
};

const validateMinEpisode = (minEpisode: unknown) => {
  if (!minEpisode) return null;
  
  if (typeof minEpisode !== "number") return "Min episode must be a number";
  if (isNaN(minEpisode) || minEpisode < 0) return "Min episode must be a positive number";
  if (!Number.isInteger(minEpisode)) return "Min episode must be an integer";
  return null;
};

const validateLibrary = (library: unknown) => {
  if (typeof library !== "string") return "Library must be a string";
  if (!library) return "Library is required";
  return null;
};

const validationsMap: Record<string, (value: unknown) => string | null> = {
  show_title: validateTitle,
  show_season: validateSeason,
  show_minEpisode: validateMinEpisode,
  show_library: validateLibrary,
}

export function validateFormData(data: Record<string, unknown>, { src }: { src?: string } = {}) {
  const errors: Record<string, string> = {};
  const entries = Object.entries(data);
  entries.forEach(([key, value]) => {
    const fieldName = src ? `${src}_${key}` : key;
    const validationFunc = validationsMap[fieldName];
    if (validationFunc) {
      const error = validationFunc(value as string);
      if (error) errors[fieldName] = error;
    }
  });
  return errors;
}
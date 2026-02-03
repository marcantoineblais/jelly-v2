import fs from "fs";
import path from "path";
import type { ConfigFile } from "@/app/types/ConfigFile";
import type { MediaLibrary } from "@/app/types/MediaLibrary";

function fromEnvOrDefault<T>(
  envValue: string | undefined,
  parse: (s: string) => T,
  fallback: T
): T {
  if (envValue == null || envValue === "") return fallback;
  try {
    return parse(envValue);
  } catch {
    return fallback;
  }
}

export function readConfig() {
  const cwd = process.cwd();
  const filename = "config.json";
  const dir = path.join(cwd, filename);

  let config: {
    download_paths?: string[];
    libraries?: { name?: string; path?: string; type?: string }[];
    videos_ext?: string[];
  } = {};

  try {
    const data = fs.readFileSync(dir, "utf-8");
    config = JSON.parse(data);
  } catch {
    // config.json missing or invalid; rely on env only
  }

  const downloadPathsFromEnv = process.env.DOWNLOAD_PATHS;
  const librariesJsonFromEnv = process.env.LIBRARIES_JSON;
  const videosExtFromEnv = process.env.VIDEOS_EXT;

  const downloadPaths = fromEnvOrDefault(
    downloadPathsFromEnv,
    (s) => s.split(",").map((p) => p.trim()).filter(Boolean),
    config.download_paths ?? []
  );

  const librariesRaw = fromEnvOrDefault(
    librariesJsonFromEnv,
    (s) => JSON.parse(s) as { name?: string; path?: string; type?: string }[],
    config.libraries ?? []
  );
  const libraries: MediaLibrary[] = librariesRaw.map((lib) => ({
    name: lib.name,
    path: lib.path,
    type:
      lib.type === "show" || lib.type === "movie" ? lib.type : undefined,
  }));

  const videosExt = fromEnvOrDefault(
    videosExtFromEnv,
    (s) => s.split(",").map((e) => e.trim()).filter(Boolean),
    config.videos_ext ?? [".mp4", ".mkv"]
  );

  const result: ConfigFile = {
    downloadPaths,
    libraries,
    videosExt,
  };
  return result;
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DOWNLOAD_PATHS: "G:/Downloads",
    VIDEO_EXT: ".mp4,.mkv",
    TMDB_API_TOKEN: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZjkxODUyNDZlMGE1MTMxM2JmOTYzM2ZlNGY3NzI4ZiIsIm5iZiI6MTc0ODAyNjMxNy44MjgsInN1YiI6IjY4MzBjM2NkYzQzNTU4MDdkMzAzNjY1YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.crxRHHj2KFpwGSIM5_rv6MIsKUdbUL5k_erSZ5A11Wg",
  },
};

export default nextConfig;

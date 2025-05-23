export function extractTitle(filename: string = "") {
  let title = filename.replaceAll(/[_\.]/g, " "); // replace spacing with actual space
  title = title.replace(/\s*\d{3,4}p.*$/, "") // remove everything after the resolution
  title = title.replace(/\s*\(\d{4}\).*$/, "") // remove everything after the resolution
  title = title.replaceAll(/\[.*\]/g, ""); // remove author and info in []
  title = title.replaceAll(/\(.*\)/g, ""); // remove author and info in ()

  return title.trim();
}
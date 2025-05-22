import H1 from "./components/elements/H1";
import fs from "fs"
import path from "path";
import { File } from "./entities/File";

const readFolders = () => {
  const rootDir = "E:/Test"
  const entries = fs.readdirSync(rootDir);
  const files: File[] = [];
  const directories: File[] = [];

  entries.forEach(entry => {
    const entryPath = path.join(rootDir, entry)
    const stats = fs.statSync(entryPath);
    const file = {path, stats}

    if (stats.isDirectory()) {
      directories.push(file);
    } else {
      files.push(file);
    }
  });
}

export default async function Home() {
  const files = readFolders();

  return (
    <main className="py-3 px-1 h-full w-full">
      <H1>Jelly</H1>
    </main>
  );
}

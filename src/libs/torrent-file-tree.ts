import type { QbitTorrentFile } from "@/src/libs/qbit/client";

export type FileNode = {
  type: "file";
  name: string;
  file: QbitTorrentFile;
};

export type FolderNode = {
  type: "folder";
  name: string;
  children: TreeNode[];
};

export type TreeNode = FileNode | FolderNode;

export function buildTree(files: QbitTorrentFile[]): TreeNode[] {
  const root: FolderNode = { type: "folder", name: "", children: [] };

  for (const file of files) {
    const parts = file.name.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let folder = current.children.find(
        (n): n is FolderNode => n.type === "folder" && n.name === part,
      );
      if (!folder) {
        folder = { type: "folder", name: part, children: [] };
        current.children.push(folder);
      }
      current = folder;
    }

    current.children.push({
      type: "file",
      name: parts[parts.length - 1],
      file,
    });
  }

  return root.children;
}

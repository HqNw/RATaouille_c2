
export interface DirItem {
  files: Array<FileNode>,
}

export interface FileItem {
  size:     number,
  modified: number,
}

export interface FileNodeData {
  name:     string,
  path:     string,
  filetype: "file" | "directory",
  node:     FileNode,
}

export type FileNode = 
  | { File: FileItem }
  | { Directory: DirItem };



export interface FileTreeItem {
  name:     string,
  type:     "file" | "directory",
  size:     string,
  modified: string,
}
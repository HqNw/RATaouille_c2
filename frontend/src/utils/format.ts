// src/utils/format.ts

export const formatDate = (dateString: number) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString()
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Unknown"
  }
}


// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
export function formatEmailDate(dateString) {
    const emailDate = new Date(dateString);
    const now = new Date();
    return emailDate.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  
  export function formatFileSize(size) {
    return size < 1024
      ? `${size} B`
      : size < 1048576
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / 1048576).toFixed(1)} MB`;
  }
  
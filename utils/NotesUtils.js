 export  const getMimeTypeFromName = (filename) => {
    if (filename.endsWith(".pdf")) return "application/pdf";
    if (filename.endsWith(".doc")) return "application/msword";
    if (filename.endsWith(".docx"))
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return "application/octet-stream"; // fallback
  };

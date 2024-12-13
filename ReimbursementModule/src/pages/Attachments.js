import React, { useState, useCallback, useEffect } from "react";
import { Button, Box, Typography, Paper, IconButton, Avatar } from "@material-ui/core";
import { debounce } from "lodash";
import DeleteIcon from "@material-ui/icons/Delete";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import PictureAsPdfIcon from "@material-ui/icons/PictureAsPdf";
import ImageIcon from "@material-ui/icons/Image";
import DescriptionIcon from "@material-ui/icons/Description";
import InsertChartIcon from "@material-ui/icons/InsertChart";
import attachmentImage from "../assets/attachmentImage.png";
import { getAttachment, deleteAttachment } from "api";



// Helper function to extract file extension
const getFileExtension = (fileName) => fileName.split('.').pop().toLowerCase();

// Function to return the appropriate icon based on the file extension
const getFileIcon = (fileName) => {
  const extension = getFileExtension(fileName);
  switch (extension) {
    case "pdf":
      return <PictureAsPdfIcon style={{ fontSize: 30, color: "#e57373" }} />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <ImageIcon style={{ fontSize: 30, color: "#64b5f6" }} />;
    case "doc":
    case "docx":
      return <DescriptionIcon style={{ fontSize: 30, color: "#4caf50" }} />;
    case "xls":
    case "xlsx":
      return <InsertChartIcon style={{ fontSize: 30, color: "#ffeb3b" }} />;
    default:
      return <InsertDriveFileIcon style={{ fontSize: 30, color: "#757575" }} />;
  }
};

const Attachments = ({ reimbursmentId, files, setFiles, isEditing, newFiles, setNewFiles }) => {
  const [fileCounter, setFileCounter] = useState(1); // Counter for unique file IDs
  const BASE_FILE_URL = "https://0ec7af20trial-dev-reimbursement1-srv.cfapps.us10-001.hana.ondemand.com";

  const handleFileClick = (ID) => {
    if (!ID) {
      console.error("File ID is not available.");
      return;
    }
    const fileUrl = `${BASE_FILE_URL}${ID}`;
    window.open(fileUrl, "_blank"); // Opens the file in a new tab
  };

  const handleFileUpload = useCallback(
    debounce(async (event) => {
      const uploadedFiles = Array.from(event.target.files); // Array of selected files

      // Filter out files that are already in the current files state based on file name
      const existingFileNames = files.map((file) => file.fileName);
      const uniqueFiles = uploadedFiles.filter(
        (file) => !existingFileNames.includes(file.name)
      );

      const newFilesList = await Promise.all(
        uniqueFiles.map(async (file) => {
          const Id = `file-${fileCounter + files.length}`;
          const reader = new FileReader();

          const tempUrl = URL.createObjectURL(file);


          return new Promise((resolve) => {
            reader.onloadend = () => {
              const base64Content = reader.result.split(",")[1]; // Base64 content
              const newFile = {
                id: Id,
                reimbursmentId: reimbursmentId,
                mediaType: file.type,
                fileName: file.name,
                size: file.size,
                url: tempUrl,
                content: base64Content,
                lastModified:  new Date(),
                isNew: true,
              };
              resolve(newFile);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        })
      );

      setFiles((prevFiles) => [...prevFiles, ...newFilesList.filter(Boolean)]);
      setNewFiles((prevNewFiles) => [...prevNewFiles, ...newFilesList.filter(Boolean)]);
      setFileCounter((prevCounter) => prevCounter + uploadedFiles.length);
    }, 300),
    [fileCounter, files, reimbursmentId]
  );

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const filteredFiles = await getAttachment(reimbursmentId);
        setFiles(filteredFiles);
        console.log("Filtered Attachments:", filteredFiles);
      } catch (error) {
        console.error("Error fetching attachments", error);
      }
    };

    fetchAttachments();
  }, [reimbursmentId, setFiles]);

  const formatFileSize = (size) => {
    const units = ["bytes", "KB", "MB", "GB", "TB"];
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }
    return `${size.toFixed(2)} ${units[index]}`;
  };

  const handleRemoveFile = async (id) => {
    // Find the file to delete
    const fileToDelete = files.find((file) => file.id === id);
    if (fileToDelete && fileToDelete.isNew !== true) {
      try {
        // Call API to delete the file from the server
        await deleteAttachment(reimbursmentId, fileToDelete.ID);
      } catch (error) {
        console.error("Error deleting file from server:", error);
      }
    }
    const afterdelete = await getAttachment(reimbursmentId);
    setFiles(afterdelete);
    setNewFiles(afterdelete);

    // // Update the local state after the file has been removed
    // setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    // setNewFiles((prevNewFiles) => prevNewFiles.filter((file) => file.id !== id));
    console.log("ghj")
  };





  return (
    <Box>
      <input
        accept="*/*"
        style={{ display: "none" }}
        id="file-upload"
        type="file"
        multiple // Allow multiple file selection
        onChange={handleFileUpload}
      />
      {isEditing ?
        (<label htmlFor="file-upload" style={{ marginLeft: "89%" }}>
          <Button variant="contained" color="primary" component="span">
            Upload Files
          </Button>
        </label>) : (<></>)}

      {files.length === 0 && (
        <Box
          mt={4}
          height={200}
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{
            backgroundImage: `url(${attachmentImage})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#f0f0f0",
          }}
        >
          <Typography variant="h6" style={{ color: "#fff", textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}>
            No files uploaded yet
          </Typography>
        </Box>
      )}

      {files.length > 0 && (
        <Paper style={{ marginTop: "16px", padding: "16px" }}>
          {files.map((file) => (
            <Box
              key={file.id}
              mb={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              padding="8px"
              borderBottom="1px solid #ddd"
            >
              <Avatar style={{ backgroundColor: "#f5f5f5", marginRight: "16px" }}>
                {getFileIcon(file.fileName)}
              </Avatar>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" flexWrap="wrap">
                <Box display="flex" alignItems="center" style={{ flexGrow: 1, minWidth: "150px" }}>
                <Typography
                    variant="body2"
                    style={{ marginRight: "10px", wordBreak: "break-word", cursor: "pointer", color: "#1976d2", fontSize:"12px" }}
                    onClick={() => handleFileClick(file.url)} // Open file when clicked
                  >
                    <strong>File Name:</strong> {file.fileName}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" style={{ flexGrow: 1, minWidth: "150px" }}>
                  <Typography variant="body2" style={{ marginRight: "10px", wordBreak: "break-word", fontSize:"12px"  }}>
                    <strong>Size:</strong> {formatFileSize(file.size)}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" style={{ flexGrow: 1, minWidth: "150px" }}>
                  <Typography variant="body2" style={{ marginRight: "10px", wordBreak: "break-word", fontSize:"12px" }}>
                    <strong>Type:</strong> {file.mediaType}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" style={{ flexGrow: 1, minWidth: "150px" }}>
                  <Typography variant="body2" style={{ wordBreak: "break-word",fontSize:"12px" }}>
                    <strong>Last Modified:</strong> {new Date(file.modifiedAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box>
                  {isEditing && (
                    <IconButton onClick={() => handleRemoveFile(file.id)}>
                      <DeleteIcon color="secondary" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default Attachments;

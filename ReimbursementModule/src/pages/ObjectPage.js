import { FaArrowLeft, FaEdit } from 'react-icons/fa';  // Font Awesome icons
import { Button, Box, Typography, AppBar, Tabs, Tab, OutlinedInput, Toolbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from "@material-ui/core";
import { getReimbursementItems, getTableCount, getGeneralInfo, updateGeneralInfo, postAttachment, updateAttachments,FMbpaTrigger } from "api";
import React, { useEffect, useRef, useState } from "react";
import Attachments from "./Attachments";
import Workflow from "./workflow";
import Comments from "./Comments";
import "./ObjectPage.css";
import ReimbursementItems from "./ReimbursementItems";


const ObjectPage = ({ onBack, rowData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [reimItems, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [reimbursmentId, setReimbursementId] = useState("");
  const [reimbursementDate, setReimbursementDate] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [newFiles, setNewFiles] = useState([]); // Newly added files after edit mode


  const generalInfoRef = useRef(null);
  const detailsRef = useRef(null);
  const attachmentsRef = useRef(null);
  const workflowRef = useRef(null);
  const commentsRef = useRef(null);
  console.log(isEditing, "isEditing");

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    console.log("Submitting changes...");
    try {
      const payload = {
        reimbursmentId,
        reimbursementDate,
        totalAmount: parseFloat(totalAmount).toFixed(2),
        status,
        headItem1: reimItems.map((item) => ({
          reimbursmentId,
          item: String(item.item),
          amountToBeReimbursed: item.amountToBeReimbursed,
          amountEligibleToClaim: item.amountEligibleToClaim,
          reimbursmentDate: item.reimbursmentDate,
          reimbursmentType: item.reimbursmentType,
          IsActiveEntity: true,
        })),
        headItem3: [{
          // commentId: `${Math.floor(Math.random() * 10000000)}`, 
          reimbursmentId,
          textArea: comment,
          IsActiveEntity: true,
        }],

      }
      await updateGeneralInfo(rowData, true, payload);
      // await postingAttachments(newFiles);
      await handleAttachments(rowData);
      console.log(typeof totalAmount, "totalamount TYpee")

      setIsEditing(false);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error submitting changes", error);
    }
  };

  // const postingAttachments = async (newFiles) => {
  //   const payload = newFiles.map((file) => ({
  //     reimbursmentId,
  //     mediaType: file.mediaType,
  //     fileName: file.fileName,
  //     size: file.size,
  //     url: file.url,
  //     content: file.content
  //   }));

  //   try {
  //     const response = await postAttachment(payload); 
  //     console.log("Files uploaded successfully:", response);
  //   } catch (error) {
  //     console.error("Error uploading files:", error);
  //   }
  // };


  const handleAttachments = async (reimbursmentId) => {
    if (!newFiles || newFiles.length === 0) return;

    try {
      for (const file of newFiles) {
        // Step 1: Upload the file
        const uploadPayload = {
          reimbursmentId,
          mediaType: file.mediaType,
          fileName: file.fileName,
          size: file.size,
          content: file.content,
        };

        console.log("Uploading file:", uploadPayload);

        const uploadResponse = await postAttachment(uploadPayload);
        console.log("Upload Response:", uploadResponse);

        // Extract the ID from the upload response
        const id = uploadResponse.ID;
        if (!id) {
          console.error("Failed to get ID from upload response for file:", file);
          continue;
        }

        console.log("File ID received:", id);

        // Step 2: Perform PATCH call to update the file URL
        const updatePayload = {
          url: `/odata/v4/my/Files(${id})/content`,
        };

        console.log("Updating file with ID:", id, "Payload:", updatePayload);

        const updateResponse = await updateAttachments(id, updatePayload);
        console.log("Attachment updated successfully:", updateResponse);
      }

      console.log("All files processed successfully.");
    } catch (error) {
      console.error("Error while handling attachments:", error);
    }
  };


  const handleCancel = () => {
    console.log("Cancelling changes...");
    setIsEditing(false);
  };
  const handleDialogClose  = async() => {
    await FMbpaTrigger(reimbursmentId);
    setDialogOpen(false);
    onBack();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const refs = [generalInfoRef, detailsRef, attachmentsRef, workflowRef, commentsRef];
    refs[newValue].current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // const columns = [
  //   { field: "reimbursmentId", headerName: "Reimbursment ID", width: 250 },
  //   { field: "item", headerName: "Item", flex: 1 },
  //   { field: "reimbursmentType", headerName: "Reimbursment Type", flex: 1 },
  //   { field: "reimbursmentDate", headerName: "Reimbursment Date", type: "date", flex: 1 },
  //   { field: "amountToBeReimbursed", headerName: "Amount To Be Reimbursed", flex: 1 },
  //   { field: "amountEligibleToClaim", headerName: "Amount Eligible To Claim", flex: 1 }
  // ];

  useEffect(() => {
    loadData(true);
    fetchGeneralInformation();
  }, []);

  const fetchGeneralInformation = async () => {
    try {
      const data = await getGeneralInfo(rowData, true);
      if (data) {
        setReimbursementId(data.reimbursmentId);
        setReimbursementDate(data.reimbursementDate || "");
        setTotalAmount(parseFloat(data.totalAmount) || "");
        setStatus("Pending");
        console.log("total amount Type", typeof totalAmount,totalAmount);
      }
    } catch (error) {
      console.error("Error fetching general information", error);
    }
  };


  // const handleInputChange = (field, index, value) => {
  //   const updatedItems = [...reimItems];
  //   updatedItems[index][field] = value;
  //   setItems(updatedItems);
  // };

  const loadData = async (isFirstLoad, skip = 0) => {
    try {
      setLoading(true);
      setItems([]);
      const count = await getTableCount();
      setRowCount(count);
      console.log("Total Count:", count); // Check count value

      const _reimItems = await getReimbursementItems(rowData);
      console.log("Reimbursement Items:", _reimItems);
      const reimitemsWithIds = _reimItems.map((reimItem, index) => ({
        ...reimItem,
        id: index + skip,
      }));
      setItems(reimitemsWithIds);
    } catch (error) {
      console.error("Error loading data", error); // Catch and log errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      paddingX={4}
      style={{
        backgroundColor: '#FAF9F6',
        borderRadius: '10px',
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.2)'
      }}
    >
      <Box height="100vh" display="flex" flexDirection="column" width="100%"
        maxWidth="1357px"
        margin="0 auto" style={{
          backgroundColor: '#FAF9F6',
          borderRadius: '10px',
          boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.2)'
        }}>

        <Box className="sticky-header" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
          <Button variant="outlined" color="Light" onClick={onBack} style={{ marginRight: "102%", marginTop: "-74px" }}>
            <FaArrowLeft />
          </Button>

<Toolbar>
            <Typography
              variant="h6"
              style={{
                marginBottom: "9px",
                marginRight: "95%",
                display: "flex",
                alignItems: "center", // Align text and icon
              }}>
              <Toolbar>
                <p 
                style={{
                  color: "gray",
                  marginTop: "4px",
                  width: "max-content",
                  fontSize:"12px"
                }}>Reimbursement ID</p>
              </Toolbar>

              <Typography
                style={{ fontWeight: "600", marginBottom:"-18%", marginLeft:"-63%", fontSize:"18px" }}
              >
                {reimbursmentId}
              </Typography>
              
            </Typography>
            {!isEditing && (
              <Button variant="outlined" onClick={handleEdit} style={{ right: "16%" }}>
                <FaEdit style={{ fontSize: '20px', color: "#2b2966db" }} />
              </Button>
            )}
          </Toolbar>

          <AppBar position="static" className="tab-app-bar">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{ className: "tab-indicator" }}
            >
              <Tab label="General Information" className="tab-label" />
              <Tab label="Reimbursement Details" className="tab-label" />
              <Tab label="Attachments" className="tab-label" />
              <Tab label="Workflow History" className="tab-label" />
              <Tab label="Comments" className="tab-label" />
            </Tabs>
          </AppBar>
        </Box>

        {/* Main Content Section */}
        <Box
          flexGrow={1}
          overflow="auto"
          padding={2}
          marginTop="10px"
        >
          <Box paddingBottom="20px">
            {/* General Information Section */}
            <Box
              ref={generalInfoRef}
              className={`section-box ${activeTab === 0 ? "highlighted-section" : "default-section"}`}
            >
              <Typography variant="h6"><strong>General Information</strong></Typography>
              <Box display="flex" flexDirection="row" alignItems="center" marginTop={2}>
                <Box marginRight={2}>
                  <Typography variant="body1"><strong>Reimbursement Date:</strong></Typography>
                  <OutlinedInput
                    value={reimbursementDate}
                    onChange={(e) => setReimbursementDate(e.target.value)}
                    placeholder="Reimbursement Date"
                    disabled={!isEditing}
                    type={isEditing ? "date" : "text"}
                  />
                </Box>
                <Box marginRight={2}>
                  <Typography variant="body1"><strong>Total Amount:</strong></Typography>
                  <OutlinedInput
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                    placeholder="Total Amount" disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <Typography variant="body1"><strong>Status:</strong></Typography>
                  <OutlinedInput
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Status" disabled={!isEditing}
                  />
                </Box>
              </Box>
            </Box>

            {/* Reimbursement Details Section */}
            <Box
              ref={detailsRef}
              className={`section-box ${activeTab === 1 ? "highlighted-section" : "default-section"}`}
            >
              <Typography variant="h6"><strong>Reimbursement Details</strong></Typography>

              <ReimbursementItems reimItems={reimItems} setItems={setItems} isEditing={isEditing}
                reimbursmentId={reimbursmentId} status={status} reimbursementDate={reimbursementDate} totalAmount={totalAmount} setTotalAmount={setTotalAmount} validationErrors={validationErrors} />

            </Box>

            {/* Attachments Section */}
            <Box
              ref={attachmentsRef}
              className={`section-box ${activeTab === 2 ? "highlighted-section" : "default-section"}`}
            >
              <Typography variant="h6"><strong>Attachments</strong></Typography>
              <Attachments reimbursmentId={rowData} files={files} setFiles={setFiles} isEditing={isEditing} newFiles={newFiles} setNewFiles={setNewFiles} />
            </Box>

            {/* Workflow History Section */}
            <Box
              ref={workflowRef}
              className={`section-box ${activeTab === 3 ? "highlighted-section" : "default-section"}`}
            >
              <Typography variant="h6"><strong>Workflow History</strong></Typography>
              <Workflow reimbursmentId={rowData} />
            </Box>

            {/* Comments Section */}
            <Box
              ref={commentsRef}
              className={`section-box ${activeTab === 4 ? "highlighted-section" : "default-section"}`}
            >
              <Typography variant="h6"><strong>Comments</strong></Typography>
              <Comments comment={comment} setComment={setComment} reimbursmentId={rowData} />
            </Box>
          </Box>
        </Box>
        <Box className="footer1">
          {isEditing ? (
            <Toolbar>
              <Button variant="contained" color="primary" onClick={handleSubmit} style={{ right: "10%" }}>Submit</Button>
              <Button variant="outlined" color="secondary" onClick={handleCancel}>Cancel</Button>
            </Toolbar>
          ) : (
            <>
            </>
          )}
        </Box>

        <Dialog open={isDialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Submission Successful</DialogTitle>
          <DialogContent>
            <Typography>
              The Reimbursement Request has been submitted with the ID: {reimbursmentId}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="primary">OK</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>

  );
};

export default ObjectPage;
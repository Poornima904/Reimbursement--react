import React, { useEffect, useRef, useState } from "react";
import {
  Button, Box, Typography, AppBar, Tabs, Tab, OutlinedInput,
  Toolbar, TextField, Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from "@material-ui/core";
import Attachments from "./Attachments";
import Workflow from "./workflow";
import Comments from "./Comments";
import ReimbursementItems from "./ReimbursementItems";
import { createReimbursement, getReimbursementWorkflowItems, postAttachment, updateAttachments, FMbpaTrigger } from "api";
import "./ObjectCreate.css";
import Loading from "./Loading";
import { FaArrowLeft } from 'react-icons/fa'; 


const ObjectCreate = ({ id, onBack, fromCreate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [reimItems, setItems] = useState([]);
  const [reimbursmentId, setreimbursmentId] = useState("");
  const [reimbursementDate, setReimbursementDate] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [status, setStatus] = useState("New");
  const [validationErrors, setValidationErrors] = useState({});
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [workflowItems, setWorkflowItems] = useState([]);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState("");

  const generalInfoRef = useRef(null);
  const detailsRef = useRef(null);
  const attachmentsRef = useRef(null);
  const workflowRef = useRef(null);
  const commentsRef = useRef(null);


  const generateRandomId = () => {
    const randomId = `${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
    setreimbursmentId(randomId);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const refs = [generalInfoRef, detailsRef, attachmentsRef, workflowRef, commentsRef];
    refs[newValue].current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDialogClose = () => {
    setErrorDialogOpen(false);
  };

  const handleSubmissionDialogClose = async() => {
    await FMbpaTrigger(id=reimbursmentId);
    setSubmissionDialogOpen(false);
    onBack();
  };

  const handleCreate = async () => {
    let formIsValid = true;
    let validationErrors = {}; // Store errors for each field

    // Validate the fields for reimItems
    reimItems.forEach((item, index) => {
      if (!item.reimbursmentDate || !item.amountToBeReimbursed || !item.amountEligibleToClaim) {
        formIsValid = false;
        validationErrors[`item-${index}-reimbursementDate`] = 'Reimbursement Date cannot be NULL';
        validationErrors[`item-${index}-amountToBeReimbursed`] = 'Amount To Be Reimbursed cannot be NULL';
      }
    });

    // Validate other fields
    if (!reimbursementDate) {
      formIsValid = false;
      validationErrors['reimbursementDate'] = 'Reimbursement Date cannot be NULL';
    }

    if (!formIsValid) {
      setValidationErrors(validationErrors);
      setErrorDialogOpen(true);
      return; // Stop the form submission
    }

    
    const payload = {
      reimbursmentId,
      reimbursementDate,
      totalAmount: parseFloat(totalAmount).toFixed(2),
      status,
      IsActiveEntity: true,
      headItem1: reimItems.map((item) => ({
        reimbursmentId,
        item: String(item.item),
        amountToBeReimbursed: item.amountToBeReimbursed,
        amountEligibleToClaim: item.amountEligibleToClaim,
        reimbursmentDate: item.reimbursmentDate,
        reimbursmentType: item.reimbursmentType,
        IsActiveEntity: true,
      })),
      headItem3: {
        // commentId: `${Math.floor(Math.random() * 10000000)}`, // Generate a random comment ID (or generate it server-side)
        reimbursmentId,
        textArea: comment,
        IsActiveEntity: true,
      },
      headItem4: workflowItems.map((workflowitem) => ({
        reimbursmentId,
        Users: workflowitem.Approvers,
        level: workflowitem.level,
        BeginDate: new Date().toISOString(),
        IsActiveEntity: true,
      })),
    };

    try {
      const response = await createReimbursement(payload);
      console.log("Data created successfully:", response);
      await handleAttachments(response.reimbursmentId);
      console.log(typeof totalAmount,"total amount typeeeee")

      setSubmissionDialogOpen(true);

    } catch (error) {
      console.error("Error creating data:", error);
    }
  };


  const handleAttachments = async (reimbursmentId) => {
    if (!files || files.length === 0) return;

    try {
      for (const file of files) {
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



  useEffect(() => {
    generateRandomId();
    const fetchReimbursementWorkflowItems = async () => {
      const items = await getReimbursementWorkflowItems();
      setWorkflowItems(items); // Ensure workflowItems is saved to state
      console.log(items);
    };
    fetchReimbursementWorkflowItems();
  }, []);

  useEffect(() => {
    debugger
    console.log(reimbursmentId);
  }, [reimbursmentId])


  if (!reimbursmentId) {
    return (
      <Loading />)
  }
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

        <Box flexGrow={1} overflow="auto" padding={2} marginTop="16px">
          <Box paddingBottom="20px">


            <Box ref={generalInfoRef} className={`section-box ${activeTab === 0 ? "highlighted-section" : "default-section"}`}>
              <Typography variant="h6"><strong>General Information</strong></Typography>
              <Box display="flex" flexDirection="row" alignItems="center" marginTop={2}>
                <Box marginRight={2}>
                  <Typography variant="body1"><strong>Reimbursement Date:</strong></Typography>
                  <TextField
                    type="date"
                    value={reimbursementDate}
                    onChange={(e) => setReimbursementDate(e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    error={!!validationErrors['reimbursementDate']} // Check if there's an error for this field
                    helperText={validationErrors['reimbursementDate']} // Show the error message
                  />

                </Box>
                <Box marginRight={2}>
                  <Typography variant="body1"><strong>Total Amount:</strong></Typography>
                  <OutlinedInput
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                    placeholder="Total Amount"
                  />

                </Box>
                <Box>
                  <Typography variant="body1"><strong>Status:</strong></Typography>
                  <OutlinedInput value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" />
                </Box>
              </Box>
            </Box>

            <Box ref={detailsRef} className={`section-box ${activeTab === 1 ? "highlighted-section" : "default-section"}`}>
              <Typography variant="h6"><strong>Reimbursement Details</strong></Typography>
              <ReimbursementItems reimItems={reimItems} setItems={setItems} isEditing="true" reimbursmentId={reimbursmentId} status={status}
                reimbursementDate={reimbursementDate} totalAmount={totalAmount} setTotalAmount={setTotalAmount} validationErrors={validationErrors} />
            </Box>

            <Box ref={attachmentsRef} className={`section-box ${activeTab === 2 ? "highlighted-section" : "default-section"}`}>
              <Typography variant="h6"><strong>Attachments</strong></Typography>
              <Attachments reimbursmentId={reimbursmentId} files={files} setFiles={setFiles} isEditing="true" />
            </Box>

            <Box ref={workflowRef} className={`section-box ${activeTab === 3 ? "highlighted-section" : "default-section"}`}>
              <Typography variant="h6"><strong>Workflow History</strong></Typography>
              <Workflow reimbursmentId={reimbursmentId} />
            </Box>

            <Box ref={commentsRef} className={`section-box ${activeTab === 4 ? "highlighted-section" : "default-section"}`}>
              <Typography variant="h6"><strong>Comments</strong></Typography>
              <Comments comment={comment} setComment={setComment} reimbursmentId={reimbursmentId} />
            </Box>
          </Box>
        </Box>

        <Box className="footer">
          <Button variant="outlined" color="primary" onClick={onBack} style={{ right: "7%" }}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleCreate}>
            Create
          </Button>
        </Box>
        <Dialog open={errorDialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            {Object.values(validationErrors).map((error, index) => (
              <Typography key={index} color="error">{error}</Typography>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>

        {/* Submission Success Dialog */}
        <Dialog open={submissionDialogOpen} onClose={handleSubmissionDialogClose}>
          <DialogTitle>Success</DialogTitle>
          <DialogContent>
            <Typography>Your reimbursement has been successfully created!</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSubmissionDialogClose} color="primary">Okay</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>


  );
};

export default ObjectCreate;

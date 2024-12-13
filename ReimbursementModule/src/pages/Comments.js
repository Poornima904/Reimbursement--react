import React, { useEffect, useState } from "react";
import { Button, Box, OutlinedInput, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Divider, Avatar } from "@material-ui/core";
import { getComments } from "api";

const Comments = ({comment, setComment, reimbursmentId}) => {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const comments = await getComments(reimbursmentId);
                console.log("comments",comments);
                const formattedComments = comments.map((item, index) => ({
                    id: index + 1,
                    text: item.textArea, // accessing text from comments.value[0].textArea
                    date: item.date || new Date().toISOString().slice(0, 10), // Use item.date if available
                    user: item.user || "Unknown User",
                    avatar: item.avatar || "/path/to/default-avatar.jpg" // Placeholder avatar
                }));
                setHistory(formattedComments);
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            }
        };

        fetchComments();
    }, [reimbursmentId]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Button
                variant="contained"
                color="primary"
                style={{ marginBottom: "4px", marginLeft: "85%" }}
                onClick={handleClickOpen}
            >
                Comment History
            </Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box flexGrow={1} mr={2}>
                    <OutlinedInput
                        placeholder="Add a comment..."
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </Box>
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Comment History</DialogTitle>

                <DialogContent dividers style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {history.length > 0 ? (
                        history.map((entry) => (
                            <Box key={entry.id} display="flex" mb={2} alignItems="flex-start">
                                <Avatar alt={entry.user} src={entry.avatar} style={{ marginRight: 8 }} />
                                <Box>
                                    <Typography variant="body1"><strong>{entry.user}</strong></Typography>
                                    <Typography variant="body2" color="textSecondary">{entry.date}</Typography>
                                    <Typography variant="body2">{entry.text}</Typography>
                                    <Divider style={{ margin: "10px 0" }} />
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="textSecondary">No comment history available.</Typography>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} color="secondary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Comments;

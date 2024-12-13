import React, { useEffect, useState } from "react";
import { Button, Box, Typography, AppBar, Tabs, Tab, OutlinedInput, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { getWorkflowItems, getTableCount } from "api";

const Workflow = ({ reimbursmentId }) => {
  const [workflowItems, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // Assuming these are the necessary columns for your DataGrid
  const columnsworkflow = [
    { field: "level", headerName: "Level", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "BeginDate", headerName: "Begin Date", flex: 1 },
    { field: "EndDate", headerName: "End Date", flex: 1 },
    { field: "DaysTaken", headerName: "Days Taken", flex: 1 },
    { field: "Users", headerName: "Users", flex: 1 },
    { field: "ApprovedBy", headerName: "Approved By", flex: 1 },
  ];

  const PAGE_SIZE = 15;

  // Function to load workflow items and get row count
  const loadData = async (isFirstLoad, skip = 0) => {
    try {
      setLoading(true);
      setItems([]);

      if (isFirstLoad) {
        const count = await getTableCount();
        setRowCount(count);
      }

      const _workflowItems = await getWorkflowItems(reimbursmentId);
      console.log("workflowitems", _workflowItems)
      const workflowItemsWithIds = _workflowItems.map((workflowItem, index) => ({
        ...workflowItem,
        id: index + skip,
      }));
      setItems(workflowItemsWithIds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true); // Load the initial data on mount

  }, []);

  return (
    <Box py={5}>


      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columnsworkflow.map((column) => (
                <TableCell key={column.field}>{column.headerName}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {workflowItems.map((row) => (
              <TableRow key={row.id}>
                {columnsworkflow.map((column) => (
                  <TableCell key={column.field}>{row[column.field]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
};

export default Workflow;

import React, { useEffect, useRef, useState } from "react";
import {
  Button, Box, OutlinedInput, Select, MenuItem, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography,IconButton,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import {deleteReimItems,updateGeneralInfo} from "api";

export default function ReimbursementItems({
  reimItems,
  setItems,
  isEditing,
  reimbursementId,
  status,
  reimbursmentDate,
  totalAmount,
  setTotalAmount,
  validationErrors,
}) {
  const [nextItemId, setNextItemId] = useState(10);

  const reimbursementTypes = ["Travel", "Meals", "Supplies", "Accommodation"];
  const reimbursementTypeDefaults = {
    Travel: 500,
    Meals: 200,
    Supplies: 300,
    Accommodation: 1000,
  };

  const handleAddItem = () => {
    const lastItemValue = reimItems.length > 0 ? reimItems[reimItems.length - 1].item : 0;
    const newItem = {
      id: nextItemId,
      item: Number(lastItemValue) + 10 || 10,
      reimbursmentType: "",
      reimbursmentDate: "",
      amountToBeReimbursed: "",
      amountEligibleToClaim: "",
    };
    setItems((prevItems) => [...prevItems, newItem]);
    setNextItemId((prevId) => prevId + 10);
  };

  const handlereimbursmentDateChange = (e, id) => {
    const updatedItems = reimItems.map((item) =>
      item.id === id ? { ...item, reimbursmentDate: e.target.value } : item
    );
    setItems(updatedItems);
  };

  const handleReimbursementTypeChange = (value, id) => {
    const updatedItems = reimItems.map((item) =>
      item.id === id
        ? {
          ...item,
          reimbursmentType: value,
          amountEligibleToClaim: reimbursementTypeDefaults[value],
        }
        : item
    );
    setItems(updatedItems);
  };

  const handleAmountToBeReimbursedChange = (e, id) => {
    const value = parseFloat(e.target.value) || 0;
    const updatedItems = reimItems.map((item) =>
      item.id === id
        ? {
          ...item,
          amountToBeReimbursed:
            value > item.amountEligibleToClaim
              ? item.amountEligibleToClaim // Set to eligible amount if input exceeds it
              : value,
        }
        : item
    );

    setItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const calculateTotalAmount = (items) => {
    const total = items.reduce(
      (sum, item) => sum + (parseFloat(item.amountToBeReimbursed) || 0),
      0
    );
    setTotalAmount(parseFloat(total));
  };

  const handleDeleteItem = async (id) => {
    const itemToDelete = reimItems.find((item) => item.id === id);
  
    if (!itemToDelete) {
      console.error('Item not found for deletion.');
      return;
    }
    if (itemToDelete.reimbursmentId) {
    try {
      await deleteReimItems(itemToDelete.reimbursmentId,itemToDelete.item );
      console.log('Item deleted successfully');
      
      // Update the item list and reindex item numbers
      const updatedItems = reimItems.filter((item) => item.id !== id);
      const reindexedItems = updatedItems.map((item, index) => ({
        ...item,
        item: (index + 1) * 10,
      }));

      const payload = {
        reimbursmentId:itemToDelete.reimbursmentId,
        headItem1: [{
          reimbursmentId:itemToDelete.reimbursmentId,
          item: String(reindexedItems[0].item),
          IsActiveEntity: true,
        }]
      }
      await updateGeneralInfo(itemToDelete.reimbursmentId, true, payload);

      setItems(reindexedItems);
      calculateTotalAmount(reindexedItems);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }else{
    const updatedItems = reimItems.filter((item) => item.id !== id);
      const reindexedItems = updatedItems.map((item, index) => ({
        ...item,
        item: (index + 1) * 10,
      }));
      setItems(reindexedItems);
      calculateTotalAmount(reindexedItems);
  }
  };
  

  useEffect(() => {
    console.log("ReimItems:", reimItems);
  }, [reimItems]);


  return (
    <Box py={5}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Reimbursement Type</TableCell>
              <TableCell>Reimbursement Date</TableCell>
              <TableCell>Amount To Be Reimbursed</TableCell>
              <TableCell>Amount Eligible To Claim</TableCell>
              {isEditing && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {reimItems.map((item) => (
              <TableRow key={item.id} className="custom-table-row">
                <TableCell>{item.item}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={item.reimbursmentType}
                      onChange={(e) =>
                        handleReimbursementTypeChange(e.target.value, item.id)
                      }
                      displayEmpty
                      style={{ width: "100%" }}
                    >
                      <MenuItem value="" disabled>
                        Select Type
                      </MenuItem>
                      {reimbursementTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <Typography>
                      {item.reimbursmentType || "-"}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField
                      type="date"
                      value={item.reimbursmentDate}
                      onChange={(e) => handlereimbursmentDateChange(e, item.id)}
                      InputLabelProps={{ shrink: true }}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <Typography>
                      {item.reimbursmentDate || "-"}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <OutlinedInput
                      value={item.amountToBeReimbursed || ""}
                      onChange={(e) =>
                        handleAmountToBeReimbursedChange(e, item.id)
                      }
                      placeholder="Amount to be reimbursed"
                      error={
                        !!validationErrors[
                        `item-${item.id}-amountToBeReimbursed`
                        ]
                      }
                      aria-describedby={`item-${item.id}-amountToBeReimbursed-error`}
                    />
                  ) : (
                    item.amountToBeReimbursed || "-"
                  )}
                </TableCell>
                <TableCell>{item.amountEligibleToClaim || "-"}</TableCell>

                {isEditing && (
                  <TableCell>
                    <IconButton onClick={() => handleDeleteItem(item.id)}>
                      <DeleteIcon color="secondary" />
                    </IconButton>
                  </TableCell>
                )}

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {isEditing && (
        <Button
          variant="outlined"
          color="primary"
          onClick={handleAddItem}
          style={{ marginTop: "16px" }}
        >
          Add Item
        </Button>
      )}
    </Box>
  );
}

import React, { forwardRef, useEffect, useState, useRef, useImperativeHandle } from "react";
import {
  Button, Box, OutlinedInput, Select, MenuItem, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import { deleteReimItems, updateGeneralInfo } from "api";

const ReimbursementItems = forwardRef(({ reimItems, setItems, isEditing, reimbursementId, status, reimbursmentDate, totalAmount, setTotalAmount, }, ref) => {
  const itemRefs = useRef({});
  const [validationErrors, setValidationErrors] = useState({});
  const [nextItemId, setNextItemId] = useState(10);

  const reimbursementTypes = ["Travel", "Meals", "Supplies", "Accommodation"];
  const reimbursementTypeDefaults = {
    Travel: 500,
    Meals: 200,
    Supplies: 300,
    Accommodation: 1000,
  };

  useImperativeHandle(ref, () => ({
    validateItems,
  }));

  const validateItems = () => {
    const errors = {};

    reimItems.forEach((item) => {
      if (!item.reimbursmentType) {
        errors[`reimbursmentType-${item.id}`] = "Reimbursement Type is required";
        itemRefs.current[`reimbursmentType-${item.id}`]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      if (!item.reimbursmentDate) {
        errors[`reimbursmentDate-${item.id}`] = "Reimbursement Date is required";
        itemRefs.current[`reimbursmentDate-${item.id}`]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      if (!item.amountToBeReimbursed) {
        errors[`amountToBeReimbursed-${item.id}`] = "Amount to be reimbursed is required";
        itemRefs.current[`amountToBeReimbursed-${item.id}`]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });

    setValidationErrors(errors);

    // Return true if there are errors
    return Object.keys(errors).length > 0;
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

  const handleReimbursementDateChange = (field, value, id) => {
    const updatedItems = reimItems.map((item) =>
      item.id === id ? { ...item, reimbursmentDate: value } : item
    );
    setItems(updatedItems);

    setValidationErrors((prevErrors) => {
      const newErrors = { ...prevErrors }; // Create a copy of the errors object
      delete newErrors[`${field}-${id}`];  // Remove the specific error
      return newErrors; // Return the updated errors object

    });
  };

  const handleReimbursementTypeChange = (field, value, id) => {
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
    setValidationErrors((prevErrors) => {
      const newErrors = { ...prevErrors }; // Create a copy of the errors object
      delete newErrors[`${field}-${id}`];  // Remove the specific error
      return newErrors; // Return the updated errors object
    });
  };

  const handleAmountToBeReimbursedChange = (field, newValue, id) => {
    const amount = parseFloat(newValue) || 0; // Renamed 'value' to 'amount' to avoid conflict
    const updatedItems = reimItems.map((item) =>
      item.id === id
        ? {
          ...item,
          amountToBeReimbursed:
            amount > item.amountEligibleToClaim
              ? item.amountEligibleToClaim // Set to eligible amount if input exceeds it
              : amount,
        }
        : item
    );

    setItems(updatedItems);
    calculateTotalAmount(updatedItems);

    setValidationErrors((prevErrors) => {
      const newErrors = { ...prevErrors }; // Create a copy of the errors object
      delete newErrors[`${field}-${id}`];  // Remove the specific error
      return newErrors; // Return the updated errors object
    });
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
      console.error("Item not found for deletion.");
      return;
    }
    if (itemToDelete.reimbursmentId) {
      try {
        await deleteReimItems(itemToDelete.reimbursmentId, itemToDelete.item);
        console.log("Item deleted successfully");

        // Update the item list and reindex item numbers
        const updatedItems = reimItems.filter((item) => item.id !== id);
        const reindexedItems = updatedItems.map((item, index) => ({
          ...item,
          item: (index + 1) * 10,
        }));

        const payload = {
          reimbursmentId: itemToDelete.reimbursmentId,
          headItem1: [{
            reimbursmentId: itemToDelete.reimbursmentId,
            item: String(reindexedItems[0].item),
            IsActiveEntity: true,
          }]
        };
        await updateGeneralInfo(itemToDelete.reimbursmentId, true, payload);

        setItems(reindexedItems);
        calculateTotalAmount(reindexedItems);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    } else {
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
            {reimItems.map((item, index) => (
              <TableRow key={item.id} className="custom-table-row">
                <TableCell>{item.item}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <div
                      ref={(el) =>
                        (itemRefs.current[`reimbursmentType-${item.id}`] = el)
                      }
                    >
                      <Select
                        value={item.reimbursmentType || ""}
                        onChange={(e) =>
                          handleReimbursementTypeChange("reimbursmentType", e.target.value, item.id)
                        }
                        displayEmpty
                        style={{
                          width: "100%", border:
                            validationErrors[`reimbursmentType-${item.id}`]
                              ? "1px solid red"
                              : "1px solid #ccc",
                        }}
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
                      {validationErrors[`reimbursmentType-${item.id}`] && (
                        <span style={{ color: "red" }}>
                          {validationErrors[`reimbursmentType-${item.id}`]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Typography>{item.reimbursmentType || "-"}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div
                      ref={(el) =>
                        (itemRefs.current[`reimbursmentDate-${item.id}`] = el)
                      }
                    >
                      <TextField
                        type="date"
                        value={item.reimbursmentDate || ""}
                        onChange={(e) =>
                          handleReimbursementDateChange("reimbursmentDate", e.target.value, item.id)
                        }
                        style={{
                          width: "100%",
                          border:
                            validationErrors[`reimbursmentDate-${item.id}`]
                              ? "1px solid red"
                              : "1px solid #ccc",
                        }}
                      />
                      {validationErrors[`reimbursmentDate-${item.id}`] && (
                        <span style={{ color: "red" }}>
                          {validationErrors[`reimbursmentDate-${item.id}`]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Typography>{item.reimbursmentDate || "-"}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div
                      ref={(el) =>
                        (itemRefs.current[`amountToBeReimbursed-${item.id}`] = el)
                      }
                    >
                      <TextField
                        type="number"
                        value={item.amountToBeReimbursed || ""}
                        onChange={(e) =>
                          handleAmountToBeReimbursedChange(
                            "amountToBeReimbursed",
                            e.target.value,
                            item.id
                          )
                        }
                        style={{
                          width: "100%",
                          border:
                            validationErrors[`amountToBeReimbursed-${item.id}`]
                              ? "1px solid red"
                              : "1px solid #ccc",
                        }}
                      />
                      {validationErrors[`amountToBeReimbursed-${item.id}`] && (
                        <span style={{ color: "red" }}>
                          {validationErrors[`amountToBeReimbursed-${item.id}`]}
                        </span>
                      )}
                    </div>
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
  )
}
)

export default ReimbursementItems;

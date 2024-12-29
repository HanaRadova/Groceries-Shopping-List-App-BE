import express from "express";
import { shoppingLists } from "../server.js";
import { v4 as uuidv4 } from "uuid";

export const shoppingListRouter = express.Router();

// Utility function to find a shopping list
const findShoppingList = (listID) => shoppingLists.find((list) => list._ID === listID);

// Middleware to check if a shopping list exists
const checkShoppingList = (req, res, next) => {
  const shoppingList = findShoppingList(req.params.id);
  if (!shoppingList) {
    return res.status(404).json({ message: "Shopping list not found" });
  }
  req.shoppingList = shoppingList; // Attach the shopping list to the request object
  next();
};

// Middleware to check user permissions
const checkAccess = (req, res, next) => {
  const { shoppingList } = req;
  const userID = req.user.id;

  if (
    shoppingList.listCreatorID !== userID &&
    !shoppingList.memberIDs.includes(userID)
  ) {
    return res.status(403).json({ message: "You do not have access to this shopping list" });
  }
  next();
};

// Middleware to check ownership
const checkOwnership = (req, res, next) => {
  const { shoppingList } = req;
  const userID = req.user.id;

  if (shoppingList.listCreatorID !== userID) {
    return res.status(403).json({ message: "Only the owner can perform this action" });
  }
  next();
};

// GET: Fetch shopping lists
shoppingListRouter.get("/", (req, res) => {
  const userID = req.user.id;
  const showArchived = req.query.archived === "true";

  const filteredLists = shoppingLists.filter(
    (list) =>
      (list.listCreatorID === userID || list.memberIDs.includes(userID)) &&
      (showArchived || !list.archived)
  );

  res.json(filteredLists);
});

// PATCH: Archive a shopping list
shoppingListRouter.patch("/:id/archive", checkShoppingList, checkOwnership, (req, res) => {
  req.shoppingList.archived = true;
  res.json({ message: "Shopping list archived", shoppingList: req.shoppingList });
});

// PATCH: Update shopping list name
shoppingListRouter.patch("/:id", checkShoppingList, checkOwnership, (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Invalid update data" });
  }

  req.shoppingList.name = name;
  res.status(200).json({ message: "Shopping list updated", shoppingList: req.shoppingList });
});

// DELETE: Remove a member from a shopping list
shoppingListRouter.delete("/:id/members/:memberID", checkShoppingList, (req, res) => {
  const userID = req.user.id;
  const { memberID } = req.params;
  const { shoppingList } = req;

  if (shoppingList.listCreatorID !== userID && memberID !== userID) {
    return res.status(403).json({
      message: "Only the owner or the member themselves can remove members",
    });
  }

  shoppingList.memberIDs = shoppingList.memberIDs.filter((id) => id !== memberID);
  res.json({ message: `Member ${memberID} removed`, shoppingList });
});

// POST: Create a new shopping list
shoppingListRouter.post("/", (req, res) => {
  const { name, memberIDs, items } = req.body;

  // Ensure only admin can create a list
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized to create shopping lists" });
  }

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const userID = req.user.id;
  const newShoppingList = {
    _ID: uuidv4(),
    listCreatorID: userID,
    name,
    memberIDs: memberIDs || [],
    items: items || [],
    archived: false,
  };

  shoppingLists.push(newShoppingList);
  res.status(201).json(newShoppingList);
});

// DELETE: Delete a shopping list
shoppingListRouter.delete("/:id", checkShoppingList, checkOwnership, (req, res) => {
  const index = shoppingLists.findIndex((list) => list._ID === req.params.id);
  shoppingLists.splice(index, 1);
  res.status(204).send();
});

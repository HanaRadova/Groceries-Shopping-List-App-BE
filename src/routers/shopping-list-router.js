import express from "express";
import { shoppingLists } from "../server.js";
import { v4 as uuidv4 } from "uuid";

export const shoppingListRouter = express.Router();

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

shoppingListRouter.patch("/:id/archive", (req, res) => {
  const userID = req.user.id;
  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });
  if (shoppingList.listCreatorID !== userID) {
    return res
      .status(403)
      .json({ message: "Only the owner can archive this shopping list" });
  }

  shoppingList.archived = true;
  res.json({ message: "Shopping list archived", shoppingList });
});

shoppingListRouter.patch("/:id/name", (req, res) => {
  const userID = req.user.id;
  const { name } = req.body;

  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });
  if (shoppingList.listCreatorID !== userID) {
    return res
      .status(403)
      .json({ message: "Only the owner can update this shopping list" });
  }

  shoppingList.name = name;
  res.json({ message: "Shopping list name updated", shoppingList });
});

shoppingListRouter.delete("/:id/members/:memberID", (req, res) => {
  const userID = req.user.id;
  const memberID = req.params.memberID;

  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });

  if (shoppingList.listCreatorID !== userID && memberID !== userID) {
    return res.status(403).json({
      message: "Only the owner or the member themselves can remove members",
    });
  }

  shoppingList.memberIDs = shoppingList.memberIDs.filter(
    (id) => id !== memberID
  );
  res.json({ message: `Member ${memberID} removed`, shoppingList });
});

shoppingListRouter.post("/", (req, res) => {
  const { name, memberIDs, items } = req.body;
  const userID = req.user.id;
  const newShoppingList = {
    _ID: uuidv4(),
    listCreatorID: userID,
    name,
    memberIDs: memberIDs || [],
    items: items || [],
  };
  shoppingLists.push(newShoppingList);
  res.status(201).json(newShoppingList);
});

shoppingListRouter.post("/:id/items", (req, res) => {
  const userID = req.user.id;
  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });
  if (
    shoppingList.listCreatorID !== userID &&
    !shoppingList.memberIDs.includes(userID)
  ) {
    return res.status(403).json({
      message: "You do not have permission to add items to this shopping list",
    });
  }

  const { content } = req.body;
  if (!content)
    return res.status(400).json({ message: "Item content is required" });

  const newItem = {
    _ID: uuidv4(),
    content,
    itemCreatorID: userID,
    done: false,
  };

  shoppingList.items.push(newItem);
  res
    .status(201)
    .json({ message: "Item added to shopping list", item: newItem });
});

shoppingListRouter.post("/:id/members", (req, res) => {
  const userID = req.user.id;
  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });
  if (shoppingList.listCreatorID !== userID) {
    return res.status(403).json({
      message: "Only the owner can add members to this shopping list",
    });
  }

  const { memberID } = req.body;
  if (!memberID)
    return res.status(400).json({ message: "Member ID is required" });

  if (shoppingList.memberIDs.includes(memberID)) {
    return res.status(400).json({ message: "This user is already a member" });
  }

  shoppingList.memberIDs.push(memberID);
  res
    .status(201)
    .json({ message: "Member added to shopping list", shoppingList });
});

shoppingListRouter.patch("/:id/items/:itemID", (req, res) => {
  const userID = req.user.id;
  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });
  if (
    shoppingList.listCreatorID !== userID &&
    !shoppingList.memberIDs.includes(userID)
  ) {
    return res.status(403).json({
      message:
        "You do not have permission to update items in this shopping list",
    });
  }

  const item = shoppingList.items.find(
    (item) => item._ID === req.params.itemID
  );
  if (!item) return res.status(404).json({ message: "Item not found" });

  const { content, done } = req.body;

  if (content !== undefined) item.content = content;
  if (done !== undefined) item.done = done;

  res.json({ message: "Item updated", item });
});

shoppingListRouter.delete("/:id", (req, res) => {
  const userID = req.user.id;
  const index = shoppingLists.findIndex((list) => list._ID === req.params.id);

  if (index === -1)
    return res.status(404).json({ message: "Shopping list not found" });

  const shoppingList = shoppingLists[index];
  if (shoppingList.listCreatorID !== userID) {
    return res
      .status(403)
      .json({ message: "Only the owner can delete this shopping list" });
  }

  shoppingLists.splice(index, 1);
  res.status(204).json({ message: "Shopping list deleted" });
});

shoppingListRouter.delete("/:id/items/:itemID", (req, res) => {
  const userID = req.user.id;
  const shoppingList = shoppingLists.find((list) => list._ID === req.params.id);

  if (!shoppingList)
    return res.status(404).json({ message: "Shopping list not found" });
  if (
    shoppingList.listCreatorID !== userID &&
    !shoppingList.memberIDs.includes(userID)
  ) {
    return res.status(403).json({
      message:
        "You do not have permission to delete items from this shopping list",
    });
  }

  const itemIndex = shoppingList.items.findIndex(
    (item) => item._ID === req.params.itemID
  );
  if (itemIndex === -1)
    return res.status(404).json({ message: "Item not found" });

  shoppingList.items.splice(itemIndex, 1);
  res.status(204).json({ message: "Item deleted" });
});

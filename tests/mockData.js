import { v4 as uuidv4 } from "uuid";

export const mockUsers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    role: "admin",
    token: "valid-token",
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    password: "securepass",
    role: "user",
    token: "valid-user-token",
  },
];

export const mockShoppingLists = [
  {
    _ID: "1",
    name: "Groceries",
    listCreatorID: "user1",
    memberIDs: ["user2"],
    archived: false,
    items: [{ _ID: uuidv4(), content: "Milk", itemCreatorID: "user2", done: false }],
  },
  {
    _ID: "2",
    name: "Hardware",
    listCreatorID: "user2",
    memberIDs: ["user1"],
    archived: false,
    items: [{ _ID: uuidv4(), content: "Hammer", itemCreatorID: "user1", done: true }],
  },
];

export const mockTokens = {
  "valid-token": { id: "user1", role: "admin" },
  "valid-user-token": { id: "user2", role: "user" },
};

export const resetMocks = () => ({
  mockUsers: [...mockUsers],
  mockShoppingLists: [...mockShoppingLists],
});

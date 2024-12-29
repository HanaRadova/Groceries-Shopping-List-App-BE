import express from "express";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { shoppingListRouter } from "./routers/shopping-list-router.js";

const app = express();
const port = 3000;
const secretKey = "your_secret_key";

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(bodyParser.json());

// Mock Data
export let users = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    role: "admin",
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    password: "securepass",
    role: "user",
  },
];

export let shoppingLists = [
  {
    _ID: "1",
    name: "Groceries",
    listCreatorID: "user1",
    memberIDs: ["user2"],
    items: [
      { _ID: uuidv4(), content: "Milk", itemCreatorID: "user2", done: false },
      { _ID: uuidv4(), content: "Eggs", itemCreatorID: "user1", done: true },
    ],
  },
  {
    _ID: "2",
    name: "Hardware Supplies",
    listCreatorID: "user2",
    memberIDs: [],
    items: [{ _ID: uuidv4(), content: "Hammer", itemCreatorID: "user1", done: false }],
  },
];

// Utility for mock tokens
const getMockUser = (token) => {
  const mockTokens = {
    "valid-token": { id: "user1", role: "admin" },
    "valid-user-token": { id: "user2", role: "user" },
  };
  return mockTokens[token];
};

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  if (process.env.NODE_ENV === "test") {
    const mockUser = getMockUser(token);
    if (!mockUser) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = mockUser;
    return next();
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

// Routes
app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newUser = { id: uuidv4(), name, email, password, role };
  users.push(newUser);
  res.status(201).json({ message: "User registered successfully", user: newUser });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Invalid email or password" }); // Updated message
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

app.use("/shopping-list", authenticateToken, shoppingListRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export { app };

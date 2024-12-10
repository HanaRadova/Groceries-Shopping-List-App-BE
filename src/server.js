import express from "express";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import { shoppingListRouter } from "./routers/shopping-list-router.js";

const app = express();
const port = 3000;
const secretKey = "your_secret_key";

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
      {
        _ID: uuidv4(),
        content: "Milk",
        itemCreatorID: "user2",
        done: false,
      },
      {
        _ID: uuidv4(),
        content: "Eggs",
        itemCreatorID: "user1",
        done: true,
      },
    ],
  },
  {
    _ID: "2",
    name: "Hardware Supplies",
    listCreatorID: "user2",
    memberIDs: [],
    items: [
      {
        _ID: uuidv4(),
        content: "Hammer",
        itemCreatorID: "user1",
        done: false,
      },
    ],
  },
];

app.use(bodyParser.json());

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role,
  };

  users.push(newUser);
  res
    .status(201)
    .json({ message: "User registered successfully", user: newUser });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
    expiresIn: "1h",
  });
  res.json({ message: "Login successful", token });
});

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

app.use("/shopping-list", authenticateToken, shoppingListRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

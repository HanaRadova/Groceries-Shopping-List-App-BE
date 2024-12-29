import request from "supertest";
import { app } from "../src/server.js"; // Import your app
import { jest } from "@jest/globals";
import { mockUsers } from "./mockData.js";

describe("Authentication Routes", () => {
  describe("POST /register", () => {
    it("should register a new user successfully (happy day)", async () => {
      const newUser = {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        password: "newpassword",
        role: "user",
      };

      const response = await request(app)
        .post("/register")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.name).toBe(newUser.name);
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteUser = {
        email: "missing.fields@example.com",
        password: "password",
      };

      const response = await request(app)
        .post("/register")
        .send(incompleteUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are required");
    });
  });

  describe("POST /login", () => {
    it("should log in successfully with valid credentials", async () => {
      const validUser = {
        email: mockUsers[0].email,
        password: mockUsers[0].password,
      };

      const response = await request(app)
        .post("/login")
        .send(validUser);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Login successful");
      expect(response.body).toHaveProperty("token");
    });

    it("should return 401 for invalid credentials", async () => {
      const invalidUser = {
        email: "invalid@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/login")
        .send(invalidUser);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should return 400 if email or password is missing", async () => {
      const response = await request(app)
        .post("/login")
        .send({ email: "onlyemail@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid email or password");
    });
  });
});

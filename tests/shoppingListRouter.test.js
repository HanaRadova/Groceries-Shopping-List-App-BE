import request from "supertest";
import { app } from "../src/server.js";
import { jest } from "@jest/globals";

// Mock JWT verification
jest.unstable_mockModule("jsonwebtoken", () => ({
  verify: jest.fn((token, secret, callback) => {
    if (token === "valid-token") {
      callback(null, { id: "user1", role: "admin" });
    } else if (token === "valid-user-token") {
      callback(null, { id: "user2", role: "user" });
    } else {
      callback(new Error("Invalid token"));
    }
  }),
}));

describe("Shopping List Routes", () => {
  const adminToken = "Bearer valid-token";
  const userToken = "Bearer valid-user-token";

  describe("GET /shopping-list", () => {
    it("should return a list of shopping lists (happy day)", async () => {
      const response = await request(app)
        .get("/shopping-list")
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/shopping-list");
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Token missing");
    });
  });

  describe("POST /shopping-list", () => {
    it("should create a new shopping list (happy day)", async () => {
      const newList = { name: "New List", memberIDs: ["user2"], items: [] };
      const response = await request(app)
        .post("/shopping-list")
        .set("Authorization", adminToken)
        .send(newList);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_ID");
      expect(response.body.name).toBe("New List");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/shopping-list")
        .set("Authorization", adminToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Name is required");
    });

    it("should return 403 if a non-admin user tries to create a list", async () => {
      const newList = { name: "Unauthorized List", memberIDs: [], items: [] };
      const response = await request(app)
        .post("/shopping-list")
        .set("Authorization", userToken)
        .send(newList);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Unauthorized to create shopping lists");
    });
  });

  describe("DELETE /shopping-list/:id", () => {
    it("should delete a shopping list (happy day)", async () => {
      const response = await request(app)
        .delete("/shopping-list/1")
        .set("Authorization", adminToken);

      expect(response.status).toBe(204);
    });

    it("should return 403 if the user is not the owner of the list", async () => {
      const response = await request(app)
        .delete("/shopping-list/2")
        .set("Authorization", userToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Only the owner can delete this shopping list");
    });

    it("should return 404 if the shopping list does not exist", async () => {
      const response = await request(app)
        .delete("/shopping-list/999")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Shopping list not found");
    });
  });

  describe("PATCH /shopping-list/:id", () => {
    it("should update the shopping list successfully", async () => {
      const updateData = { name: "Updated List Name" };
      const response = await request(app)
        .patch("/shopping-list/1")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.shoppingList.name).toBe("Updated List Name");
    });

    it("should return 400 if update data is invalid", async () => {
      const response = await request(app)
        .patch("/shopping-list/1")
        .set("Authorization", adminToken)
        .send({ invalidField: "Invalid" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid update data");
    });

    it("should return 404 if the shopping list does not exist", async () => {
      const response = await request(app)
        .patch("/shopping-list/999")
        .set("Authorization", adminToken)
        .send({ name: "Non-existent List" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Shopping list not found");
    });
  });
});

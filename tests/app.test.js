const request = require("supertest");
const app = require("../app");

describe("TechCart API Tests", () => {

  test("GET /health should return application health", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("UP");
    expect(response.body.service).toBe("TechCart");
  });

  test("GET /api/products should return 4 products", async () => {
    const response = await request(app).get("/api/products");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(4);
  });

});
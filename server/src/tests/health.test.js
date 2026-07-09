import request from "supertest";

import app from "../helpers/testApp.js";

describe("Health Route", () => {
  it("Should return 200", async () => {
    const res = await request(app).get(
      "/api/v1/health"
    );

    expect(res.statusCode).toBe(200);
  });
});
import request from "supertest";

// "../helpers/testApp.js" resolved to src/helpers/ — one level too high.
import app from "./helpers/testApp.js";

describe("Health Route", () => {
  it("returns 200 and reports a connected database", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.statusCode).toBe(200);
    // Asserting only on the status code would let a health check reporting a
    // downed database still pass.
    expect(res.body.data.database).toBe("connected");
  });
});

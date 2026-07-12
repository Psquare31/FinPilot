import { Router } from "express";
import userController from "./user.controller.js";
import requireAuth from "../../middlewares/authenticate.js";

const router = Router();
router.get("/me", requireAuth, userController.me);

export default router;

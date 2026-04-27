const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");
const authMiddleware = require("../config/authMiddleware");

router.post("/auth/google", controller.googleAuth);
router.post("/auth/register", controller.register);
router.post("/auth/login", controller.login);

router.post("/", controller.createUser);
router.get("/", authMiddleware, controller.getUsers);
router.get("/:id", authMiddleware, controller.getUser);
router.put("/:id", authMiddleware, controller.updateUser);
router.delete("/:id", authMiddleware, controller.deleteUser);

module.exports = router;
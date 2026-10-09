const express = require("express");
const authController = require("../controller/authController");

const router = express.Router();

router.get("/auth/session", authController.getSession);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);

module.exports = router;

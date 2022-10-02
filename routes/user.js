const express = require("express");

const { body, check } = require("express-validator");
const userController = require("../controllers/user");
const isAuth = require("../middleware/is-auth")
const router = express.Router();


router.get("/myself",isAuth, userController.getMyself);


module.exports = router;
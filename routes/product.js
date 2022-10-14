const express = require("express");

const productController = require("../controllers/product");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.get("/products", productController.getProducts);

module.exports = router;
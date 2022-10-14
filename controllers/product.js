const fs = require("fs");
const path = require("path");
const Product = require("../models/product");

exports.getProducts = async (req, res, next) => {
  try {
    let products = await Product.find().limit(20);
    console.log(products)
    res.status(200).json({
      message: "取得商品類型成功",
      products: products,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

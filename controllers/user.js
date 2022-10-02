const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const { validationResult } = require("express-validator");

exports.getMyself = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    let user = await User.findById(userId);
    if (!user) {
      const error = new Error("找不到使用者");
      error.statusCode = 404;
      next(error);
      return;
    }

    res.status(200).json({ message: "取得使用者成功", user: user });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

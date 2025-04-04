const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { validationResult } = require("express-validator");

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("欄位驗證失敗, 請重新填寫");
      error.data = errors.array();
      throw error;
    }

    const { email, name, password } = req.body;
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      name: name,
      password: hashedPw,
    });
    const result = await user.save();
    res.status(201).json({
      message: "新增使用者成功！",
      userId: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const loadedUser = await User.findOne({ email: email });
    if (!loadedUser) {
      const error = new Error("查無此email的使用者");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, loadedUser.password);
    if (!isEqual) {
      const error = new Error("密碼錯誤");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      { email: loadedUser.email, userId: loadedUser._id.toString() },
      "flowershop",
      {
        expiresIn: "48h",
      }
    );
    res.status(200).json({
      token: token,
      userId: loadedUser._id.toString(),
      userName: loadedUser.name,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

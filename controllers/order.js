const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { validationResult } = require("express-validator");
const Order = require("../models/order");
const Client = require("../models/client");

exports.getOrders = async (req, res, next) => {
  const searchKey = req.query.searchKey || "";
  const currentPage = req.query.page || 1;
  const perPage = 10;
  const searchCondition = {
    $or: [
      { note: { $regex: searchKey } },
      { address: { $regex: searchKey } },
      { phone: { $regex: searchKey } },
      { products: { $regex: searchKey } },
      { clientName: { $regex: searchKey } },
    ],
  };

  try {
    let totalOrders, orders;
    if (searchKey) {
      totalOrders = await Order.find(searchCondition).countDocuments();
      orders = await Order.find(searchCondition)
        .populate("client")
        .sort({ date: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    } else {
      totalOrders = await Order.find().countDocuments();
      orders = await Order.find()
        .populate("client")
        .sort({ date: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    }

    res.status(200).json({
      message: "取得訂單資料成功",
      orders: orders,
      totalPages: Math.ceil(totalOrders / perPage),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  const errors = validationResult(req);
  // console.log(11111111, req);
  if (!errors.isEmpty()) {
    console.log(errors);
    console.log(111111, req.body);
    const error = new Error("輸入資料不正確");
    error.statusCode = 422;
    next(error);
    // throw error;
    return;
  }
  console.log(req.body);

  const products = req.body.products;
  const totalPrice = req.body.totalPrice;
  const address = req.body.address;
  const phone = req.body.phone;
  const date = req.body.date;
  const clientId = req.body.client;
  const shippingStatus = req.body.shippingStatus;
  const note = req.body.note;
  const clientName = req.body.clientName;

  let imageUrl = "";
  if (req.file) {
    imageUrl = req.file.path;
  }
  const order = new Order({
    products: products,
    totalPrice: totalPrice,
    phone: phone,
    address: address,
    date: date,
    imageUrl: imageUrl,
    client: clientId,
    note: note,
    shippingStatus: shippingStatus,
    clientName: clientName,
  });

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      const error = new Error("查無此訂單的客戶");
      error.statusCode = 404;
      next(error);
      return;
    }
    const result = await order.save();
    // console.log(22222222222222, client);
    client.orders.push(order._id);
    await client.save();
    res.status(201).json({
      message: "新增訂單成功",
      order: order,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    let order = await Order.findById(orderId).populate("client");
    if (!order) {
      const error = new Error("找不到訂單");
      error.statusCode = 404;
      next(error);
      return;
    }

    res.status(200).json({ message: "取得訂單成功", order: order });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed, entered data is incorrect");
      error.statusCode = 422;
      next(error);
      // throw error;
      return;
    }
    // console.log("updateOrder", req.body);
    const {
      products,
      totalPrice,
      date,
      isPaid,
      shippingStatus,
      client,
      note,
      address,
      phone,
      clientName,
    } = req.body;
    console.log("shippingStatus");
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("找不到訂單資料");
      error.statusCode = 404;
      next(error);
      return;
    }
    // if (order.imageUrl !== imageUrl) {
    //   clearImage(order.imageUrl);
    // }
    order.products = products;
    order.totalPrice = totalPrice;
    order.date = date;
    order.client = client;
    order.isPaid = isPaid;
    order.note = note;
    order.shippingStatus = shippingStatus;
    order.phone = phone;
    order.address = address;
    order.clientName = clientName;

    const result = order.save();
    res.status(200).json({ message: "訂單修改成功", order: order });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed, entered data is incorrect");
      error.statusCode = 422;
      next(error);
      return;
    }
    const { idArray, statusType, updateValue } = req.body;

    const statusSetting =
      statusType === 1
        ? { isPaid: updateValue }
        : { shippingStatus: updateValue };

    Order.updateMany({ _id: { $in: idArray } }, { $set: statusSetting }).then(
      (result) => {
        if (result.modifiedCount) {
          res.status(200).json({ message: "訂單修改成功" });
        }
      }
    );
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("找不到訂單資料");
      error.statusCode = 404;
      throw error;
    }
    const clientId = order.client;

    // clearImage(order.imageUrl)
    await Order.findByIdAndRemove(orderId);
    let client = await Client.findById(clientId);
    client.orders = client.orders.pull(orderId);
    const result = await client.save();

    res.status(200).json({ message: "刪除訂單成功", result: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteManyOrders = async (req, res, next) => {
  try {
    const { idArray } = req.body;
    console.log(222222, req.body)
    await Order.deleteMany({ _id: idArray });
    res.status(200).json({ message: "刪除多筆訂單成功" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

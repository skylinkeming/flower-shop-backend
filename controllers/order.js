const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Order = require("../models/order");
const Client = require("../models/client");
const ScheduledOrder = require("../models/scheduledOrder");

exports.getOrders = async (req, res, next) => {
  let startDate = req.query.startDate || "";
  let endDate = req.query.endDate || "";
  const searchKey = req.query.searchKey || "";
  const currentPage = req.query.page || 1;

  const dateOrder = req.query.dateOrder || -1;
  const clientNameOrder = req.query.clientNameOrder;
  const totalPriceOrder = req.query.totalPriceOrder;
  const isPaidOrder = req.query.isPaidOrder;
  const shippingStatusOrder = req.query.shippingStatusOrder;
  const productsOrder = req.query.productsOrder;
  const addressOrder = req.query.addressOrder;
  const perPage = 10;

  let sortCondition = {};
  if (productsOrder) {
    sortCondition.products = productsOrder;
  } else if (addressOrder) {
    sortCondition.address = addressOrder;
  } else if (clientNameOrder) {
    sortCondition.clientName = clientNameOrder;
  } else if (totalPriceOrder) {
    sortCondition.totalPrice = totalPriceOrder;
  } else if (isPaidOrder) {
    sortCondition.isPaid = isPaidOrder;
  } else if (shippingStatusOrder) {
    sortCondition.shippingStatus = shippingStatusOrder;
  } else if (dateOrder) {
    sortCondition.date = dateOrder;
  }

  // console.log("sortCondition", sortCondition);
  const searchCondition = {
    $or: [
      { note: { $regex: searchKey } },
      { address: { $regex: searchKey } },
      { phone: { $regex: searchKey } },
      { products: { $regex: searchKey } },
      { clientName: { $regex: searchKey } },
    ],
  };
  if (endDate) {
    var result = new Date(endDate);
    result.setDate(result.getDate() + 1);
    endDate = result;
  }
  const dateRangeCondition = {
    date: {
      $gte: new Date(startDate),
      $lt: new Date(endDate),
    },
  };

  try {
    let totalOrders, orders;
    if (searchKey) {
      // console.log(sortCondition)
      totalOrders = await Order.find(searchCondition).countDocuments();
      orders = await Order.find(searchCondition)
        .populate("client")
        .sort(sortCondition)
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    }

    if (startDate && endDate && !searchKey) {
      totalOrders = await Order.find(dateRangeCondition).countDocuments();
      orders = await Order.find(dateRangeCondition)
        .populate("client")
        .sort(sortCondition)
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    }

    if (!searchKey && !startDate && !endDate) {
      totalOrders = await Order.find().countDocuments();
      orders = await Order.find()
        .populate("client")
        .sort(sortCondition)
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

exports.getMonthlyRevenue = async (req, res, next) => {
  let startDate = req.query.startDate || "";
  let endDate = req.query.endDate || "";
  let clientId = req.query.clientId || "";

  if (endDate) {
    var result = new Date(endDate);
    result.setDate(result.getDate() + 1);
    endDate = result;
  }

  const dateRangeCondition = {
    $and: [
      {
        date: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
      {
        client: clientId,
      },
      // {
      //   isPaid: true,
      // },
    ],
  };

  try {
    let orders;
    orders = await Order.find(dateRangeCondition).sort({ date: 1 });

    let revenue = {};

    for (var i = 1; i <= 12; i++) {
      revenue[ i + "月" ] = 0;
    }


    orders.map((order) => {
      let orderMonth = order.date.getMonth() + 1 + "月";
      if (revenue[ orderMonth ] === 0 || revenue[ orderMonth ]) {
        revenue[ orderMonth ] += order.totalPrice;
      }
    });

    res.status(200).json({
      message: "取得營收成功",
      monthlyRevenue: revenue,
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
    console.log("create order error", req.body);
    const error = new Error("輸入資料不正確");
    error.statusCode = 422;
    next(error);
    // throw error;
    return;
  }
  // console.log(req.body);

  const {
    products,
    totalPrice,
    address,
    phone,
    date,
    client,
    shippingStatus,
    note,
    clientName,
    scheduledOrder
  } = req.body;

  let imageUrl = "";
  if (req.file) {
    imageUrl = req.file.path;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const clientData = await Client.findById(client);

    if (!clientData) {
      const error = new Error("查無此訂單的客戶");
      error.statusCode = 404;
      next(error);
      return;
    }
    const order = new Order({
      products,
      totalPrice,
      address,
      phone,
      date,
      client,
      shippingStatus,
      note,
      clientName,
      scheduledOrder,
      imageUrl: imageUrl,
    });

    await order.save();
    
    clientData.orders.push(order._id);
    await clientData.save();

    if(scheduledOrder){
      const s_order = await ScheduledOrder.findById(scheduledOrder);

      if (!s_order) {
        const error = new Error("查無此訂單的預定訂單");
        error.statusCode = 404;
        next(error);
        return;
      }
      s_order.orders.push(order._id);
      await s_order.save();
    }

    await session.commitTransaction(); 
    session.endSession();

    res.status(201).json({
      message: "新增訂單成功",
      order: order,
    });
  } catch (err) {
    await session.abortTransaction(); 
    session.endSession();

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
    // let imageUrl = "";
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

    console.log("order.client:" + order.client);
    console.log("client:" + client);

    if (order.client != client) {
      //從舊的client中移除訂單
      if (order.client) {
        let oldClient = await Client.findById(order.client);
        if (oldClient) {
          console.log("舊的客戶訂單：" + oldClient.orders);
          if (oldClient.orders.length && oldClient.orders.includes(orderId)) {
            oldClient.orders.pull(orderId);
            oldClient.save();
          }
        }
      }
    }

    //把訂單加到新的client中
    let newClient = await Client.findById(client);
    if (!newClient.orders.includes(orderId)) {
      newClient.orders.push(orderId);
      await newClient.save();
    }
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
    // console.log(222222, req.body);
    await Order.deleteMany({ _id: idArray });
    res.status(200).json({ message: "刪除多筆訂單成功" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

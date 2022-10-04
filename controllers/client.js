const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const Order = require("../models/order");
const Client = require("../models/client");

exports.getClients = async (req, res, next) => {
  const searchKey = req.query.searchKey || "";
  const currentPage = req.query.page || 1;
  const perPage = 10;
  const searchCondition = {
    $or: [
      { name: { $regex: searchKey } },
      { address: { $regex: searchKey } },
      { phone: { $regex: searchKey } },
      { note: { $regex: searchKey } },
      { cellPhone: { $regex: searchKey } },
    ],
  };

  try {
    let clients, totalClients;
    if (searchKey) {
      totalClients = await Client.find(searchCondition).countDocuments();
      clients = await Client.find(searchCondition)
        .skip(perPage * (currentPage - 1))
        .limit(perPage)
        .populate("orders")
        .sort({ createdAt: -1 });
    } else {
      totalClients = await Client.find().countDocuments();
      clients = await Client.find()
        .skip(perPage * (currentPage - 1))
        .limit(perPage)
        .populate("orders")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      message: "取得客戶資料成功",
      clients: clients,
      totalPages: Math.ceil(totalClients / perPage),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const { name, phone, address, cellPhone, note, imagePath } = req.body;
    console.log('create client', req.body)
    const client = await Client.find({ name: name });
    let imageUrl = "";
    if (client.length > 0) {
      res.status(422).json({ message: "已存在相同名稱的客戶" });
      return;
    }

    if (imagePath) {
      imageUrl = imagePath;
    }

    const newClient = new Client({
      name: name,
      phone: phone,
      address: address,
      cellPhone: cellPhone,
      imageUrl: imageUrl,
      note: note,
    });

    const result = await newClient.save();

    res.status(201).json({ message: "新增客戶成功" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getClient = async (req, res, next) => {
  try {
    const clientId = req.params.clientId;
    const client = await Client.findById({ _id: clientId }).populate("orders");
    if (!client) {
      res.status(404).json({ message: "找不到此客戶" });
      return;
    }
    res.status(200).json({ message: "取得客戶資料成功", client: client });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const clientId = req.params.clientId;
    const { name, phone, cellPhone, address, note, orders, imagePath } =
      req.body;
    const client = await Client.findById(clientId);

    if (!client) {
      res.status(404).json({ message: "找不到此客戶" });
      return;
    }

    if (imagePath) {
      client.imageUrl = imagePath;
    }

    client.name = name;
    client.phone = phone;
    client.cellPhone = cellPhone;
    client.address = address;
    client.note = note;
    client.orders = orders;
    // if (imageUrl !== client.imageUrl) {
    //   // clearImage(client.imageUrl);
    //   client.imageUrl = imageurl;
    // }
    await client.save();
    res.status(200).json({ message: "修改客戶資料成功" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const clientId = req.params.clientId;
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404).json({ message: "找不到此客戶" });
      return;
    }
    await Client.findByIdAndDelete(clientId);
    res.status(200).json({ message: "刪除客戶資料成功" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteManyClients = async (req, res, next) => {
  try {
    const { idArray } = req.body;
    await Client.deleteMany({ _id: idArray });
    res.status(200).json({ message: "刪除客戶成功" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const ScheduledOrder = require("../models/scheduledOrder");
const Client = require("../models/client");

exports.getScheduledOrders = async (req, res, next) => {
    let startDate = req.query.startDate || "";
    let endDate = req.query.endDate || "";
    const searchKey = req.query.searchKey || "";
    const currentPage = req.query.page || 1;
    const dateOrder = req.query.dateOrder || -1;
    const perPage = 10;

    let sortCondition = {};
    if (dateOrder) {
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
            totalOrders = await ScheduledOrder.find(searchCondition).countDocuments();
            orders = await ScheduledOrder.find(searchCondition)
                // .sort(sortCondition)
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        }

        if (startDate && endDate && !searchKey) {
            totalOrders = await ScheduledOrder.find(dateRangeCondition).countDocuments();
            orders = await ScheduledOrder.find(dateRangeCondition)
                .populate("orders")
                // .populate('order.client')
                .sort(sortCondition)
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        }

        if (!searchKey && !startDate && !endDate) {
            totalOrders = await ScheduledOrder.find().countDocuments();
            orders = await ScheduledOrder.find()
                .populate({
                    path: "orders",
                    populate: { path: "client" }
                    // strictPopulate: false
                })
                .sort(sortCondition)
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        }

        res.status(200).json({
            message: "取得例行訂單資料成功",
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

exports.createScheduledOrder = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        console.log("create schedule order error", req.body);
        const error = new Error("輸入資料不正確");
        error.statusCode = 422;
        next(error);
        // throw error;
        return;
    }

    const orders = req.body.orders;
    const status = req.body.status;
    const note = req.body.note;
    const date = req.body.date;

    const scheduledOrder = new ScheduledOrder({
        orders: orders,
        status: status,
        date: date,
        note: note,
    });

    try {
        const result = await scheduledOrder.save();
        // console.log(22222222222222, client);
        res.status(201).json({
            message: "新增例行訂單成功",
            scheduledOrder: scheduledOrder,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.updateScheduledOrder = async (req, res, next) => {
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

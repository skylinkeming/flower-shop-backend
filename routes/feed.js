const express = require("express");

const { body, check } = require("express-validator");
const orderController = require("../controllers/order");
const scheduledOrderController = require("../controllers/scheduledOrder");
const clientController = require("../controllers/client");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//order

router.get("/orders", orderController.getOrders);

router.get("/orders/monthlyRevenue", orderController.getMonthlyRevenue);

router.post(
  "/order",
  isAuth,
  [ body("products").trim().isLength({ min: 4 }) ],
  orderController.createOrder
);

router.get(
  "/order/:orderId",
  [ body("products").trim().isLength({ min: 4 }) ],
  orderController.getOrder
);

router.put("/order/:orderId", isAuth, orderController.updateOrder);
router.put("/orders/updateOrderStatus", isAuth, orderController.updateOrderStatus);

router.delete("/orders/deleteManyOrders", isAuth, orderController.deleteManyOrders);
router.delete("/order/:orderId", isAuth, orderController.deleteOrder);

//scheduledOrder
router.get("/scheduledOrders", scheduledOrderController.getScheduledOrders);
router.post("/scheduledOrders",
  isAuth,
  scheduledOrderController.createScheduledOrder);

router.post(
  "/order",
  isAuth,
  [ body("products").trim().isLength({ min: 4 }) ],
  orderController.createOrder
);


//client

router.get("/clients", clientController.getClients);

router.post(
  "/client",
  isAuth,
  [ body("name").trim().isLength({ min: 3 }) ],
  clientController.createClient
);

router.get("/client/:clientId", clientController.getClient);

router.put(
  "/client/:clientId",
  isAuth,
  [ body("name").trim().isLength({ min: 3 }) ],
  clientController.updateClient
);

router.delete("/client/:clientId", isAuth, clientController.deleteClient);
router.delete("/clients/deleteManyClients", isAuth, clientController.deleteManyClients);

module.exports = router;

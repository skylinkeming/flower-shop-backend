const mongoose = require("mongoose");


const scheduledOrderSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    }
  ],
  notes: {
    type: String,
    default: "",
    required: false
  }
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ScheduledOrder", scheduledOrderSchema, "scheduled_orders");

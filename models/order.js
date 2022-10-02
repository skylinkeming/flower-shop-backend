const mongoose = require("mongoose");

const Schema = mongoose.Schema;
 
const orderSchema = new Schema(
  {
    products: {
      type: String,
      required: false,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidTime: {
      type: Date,
      required: false,
    },
    shippingStatus: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      required: false,
    },
    clientName: {
      type: String,
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Client",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);

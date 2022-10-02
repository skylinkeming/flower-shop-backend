const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    cellPhone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);

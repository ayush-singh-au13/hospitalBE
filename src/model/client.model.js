const { model, Schema } = require("mongoose");

const clientSchema = new Schema(
  {
    companyName: String,
    nameToStore: String,
    password: String,
    email: String,
    role: {
      type: String,
      enum: ["ADMIN", "CLIENT"],
      default: "CLIENT",
    },
    lastLogin: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
   
    cloudinary_id: [
      {
        document: String,
        category: String,
        clientName: String,
        uploadedAt: Date,
        empCode: String
      },
    ],
  },
  { timestamps: true }
);

module.exports = model("clients", clientSchema);

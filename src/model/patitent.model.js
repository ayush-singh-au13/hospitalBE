const { model, Schema } = require("mongoose");

const patientSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    password: String,
    email: String,
    role: {
      type: String,
      enum: ["ADMIN", "PATIENT"],
      default: "PATIENT",
    },
    lastLogin: Date,
    isDeleted :{
      type: Boolean,
      default: false
    },
    document:String,
    cloudinary_id: {
      type: String,
    },
  },
  { timestamps: true }
);
patientSchema.index({
    firstName: 1,
});

module.exports = model("Users", patientSchema);

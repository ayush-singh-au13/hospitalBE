const express = require("express");
const ctrl = require("../controllers/client.controller");
const router = express.Router();
const { checkIfUserExistsOrNot } = require("../middlewares/index");
const verifyUserToken = require("../utils/token.utils");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const patitentModel = require("../model/client.model");
const mongoose = require("mongoose");
//------------------------------------------------------------
/**
 * @POST AUTH REGISTER,
 */
router.post("/register", ctrl.register);

// @Login USER
router.post("/login", checkIfUserExistsOrNot, ctrl.login);

// @GET patientlist

router.get("/patientlist", verifyUserToken, ctrl.patientlist);

//@POST upload document
router.post("/uploadDocument", upload.single("file"), async (req, res) => {
  try {
    const id = req.query.id;
    // Upload image to cloudinary
    let maxsize = 5 * 1000 * 1024;
    if (req.file.size > maxsize) {
      return res.send("Max allowed size is 5MB");
    }

    const result = await cloudinary.uploader.upload(req.file.path);
    // Create new user
    let user = await patitentModel.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(id) },
      {
        $set: {
          document: result.secure_url,
          cloudinary_id: result.public_id,
        },
      },
      { new: true }
    );

    res.status(200).send({
      user,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
});

module.exports = router;

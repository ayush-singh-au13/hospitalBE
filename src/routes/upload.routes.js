const express = require("express");
const router = express.Router();
const upload = require("./../utils/multer");
const cloudinary = require("./../utils/cloudinary");
const clientModel = require("../model/client.model");
// const patitentModel = require("../model/client.model");
// const mongoose = require("mongoose");
//------------------------------------------------------------

//@POST upload document
router.post("/uploadDocument", upload.single("file"), async (req, res) => {
  try {
    console.log(req.file);
    let maxsize = 5 * 1000 * 1024;
    if (req.file.size > maxsize) {
      return res.send("Max allowed size is 1MB");
    }

    const result = await cloudinary.uploader.upload(req.file.path);
    // Create new user
    let user = await clientModel.create({
      companyName: req.body.companyName,
      document: result.secure_url,
      cloudinary_id: result.public_id,
    });

    res.send("File uploaded successfully!");
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
});


module.exports = router;

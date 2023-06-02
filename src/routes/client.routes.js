const express = require("express");
const ctrl = require("../controllers/client.controller");
const router = express.Router();
const { checkIfUserExistsOrNot,checkIfClientAlreadyExists } = require("../middlewares/index");
const verifyUserToken = require("../utils/token.utils");
const upload = require("./../utils/multer");
const cloudinary = require("./../utils/cloudinary");
const clientModel = require("../model/client.model");
// const patitentModel = require("../model/client.model");
// const mongoose = require("mongoose");
//------------------------------------------------------------

/**
 * @POST AUTH REGISTER,
 */
router.post("/register", ctrl.register);

// @Login USER
router.post("/login", checkIfUserExistsOrNot, ctrl.login);

// @GET patientlist

router.get("/reportList", verifyUserToken, ctrl.reportList);
// @GET add client
router.post("/addclient", verifyUserToken, checkIfClientAlreadyExists,  ctrl.addclient);

//@GET client list
router.get("/clientList", verifyUserToken, ctrl.clientList)

//@GET client minified list
router.get("/clientMinifiedList", verifyUserToken, ctrl.clientMinifiedList)

// @GET
router.post("/readFile", upload.single("file"), verifyUserToken, ctrl.readFile)

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

router.post("/downloadFile", verifyUserToken, ctrl.downloadFile);
router.get('/documentList', verifyUserToken, ctrl.documentList)

module.exports = router;

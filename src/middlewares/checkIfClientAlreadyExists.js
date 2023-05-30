const clientModel = require("../model/client.model");
const _ = require("lodash");

module.exports = async (req, res, next) => {
  try {
    console.log("check if patient exists or not !");
    const { email, password } = req.body;
    const clientData = await clientModel
      .findOne({ email: email.toLowerCase() })
      .lean();
    if (!_.isEmpty(clientData)) {
      return res.send({ status: 400, message: "Client Already Exists !" });
    }
    return next();
  } catch (err) {
    // console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

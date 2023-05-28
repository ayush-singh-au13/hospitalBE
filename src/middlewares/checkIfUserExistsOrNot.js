const clientModel = require("../model/client.model");
const bcrypt = require("bcryptjs");
const _ = require("lodash");

module.exports = async (req, res, next) => {
  try {
    console.log("check if patient exists or not !");
    const { email, password } = req.body;
    const clientData = await clientModel
      .findOne({ email: email.toLowerCase() })
      .lean();
    if (_.isEmpty(clientData)) {
      return res.send({ status: 400, message: "Not Found, please signup !" });
    }

    if (_.isEmpty(clientData)) {
      return res.send({
        status: 409,
        message: "User does not exist, please register !!!",
      });
    }

    req.user = { ...clientData };

    const validPassword = bcrypt.compareSync(password, clientData.password);

    if (!validPassword) {
      return res.send({
        status: 401,
        message: "Invalid Password !!",
      });
    }
    return next();
  } catch (err) {
    // console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

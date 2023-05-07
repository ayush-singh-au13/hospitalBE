const patitentModel = require("../model/client.model");
const bcrypt = require("bcryptjs");

module.exports = async (req, res, next) => {
  try {
    console.log("check if patient exists or not !");
    const { email } = req.body;
    const patientData = await patitentModel
      .findOne({ email: email.toLowerCase() })
      .lean();
    if (_.isEmpty(patientData)) {
      return res.send({ status: 400, message: "Not Found, please signup !" });
    }

    if (_.isEmpty(user)) {
      return res.send({
        status: 409,
        message: "User does not exist, please register !!!",
      });
    }

    req.user = { ...patientData };

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.send({
        status: 401,
        message: "Invalid Password !!",
      });
    }
    return next();
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

const clientModel = require("../model/client.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    console.log("Registering a client !");
    const { companyName, email, password } = req.body;

    const salt = bcrypt.genSaltSync(parseInt(10));
    const hashPassword = bcrypt.hashSync(password, salt);

    const createuser = await clientModel.create({
      companyName: companyName,
      email: email.toLowerCase(),
      password: hashPassword,
    });

    return res.status(201).send({
      status: 201,
      message: "Registration is successfull !",
      data: createuser,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// login user
exports.login = async (req, res) => {
  try {
    const payload = {
      _id: req.user._id,
      companyName: req.body.companyName,
      email: req.user.email,
      role: req.user.role,
    };

    const token = jwt.sign(payload, "THAKURHOSPITALSECRETKEY", {
      expiresIn: "8h",
    });
    // console.log(token,"=====>");

    payload["token"] = token;
    if (token) {
      await clientModel.updateOne(
        { email: payload.email },
        {
          $set: {
            lastLogin: Date.now(),
          },
        }
      );

      return res.send({
        status: 200,
        message: "User logged in successfully",
        data: payload,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// @GET patient list

exports.patientlist = async () => {
  try {
    console.log("Get the client list !");
    const { role } = req.user;
    if (role === "CLIENT") {
      return res.send({
        status: 403,
        message: "You are not allowed to access this route !",
      });
    }
    const patientList = await clientModel
      .find({ isDeleted: false })
      .select({ companyName: 1 })
      .lean();

    return res.status(200).send({
      status: 200,
      message: "Client Minified List !",
      data: patientList,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

//@upload document

const patientModel = require("../model/patitent.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    console.log("Registering a patient !");
    const { firstName, lastName, email, password } = req.body;

    const salt = bcrypt.genSaltSync(parseInt(10));
    const hashPassword = bcrypt.hashSync(password, salt);

    const createuser = await patientModel.create({
      firstName: firstName,
      lastName: lastName,
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
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    };

    const token = jwt.sign(payload, "THAKURHOSPITALSECRETKEY", {
      expiresIn: "8h",
    });
    // console.log(token,"=====>");

    payload["token"] = token;
    if (token) {
      await patientModel.updateOne(
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
    console.log("Get the patient list !");
    const { role } = req.user;
    if (role === "PATIENT") {
      return res.send({
        status: 403,
        message: "You are not allowed to access this route !",
      });
    }
    const patientList = await patientModel
      .find({ isDeleted: false })
      .select({ __v: 0, updatedAt: 0 })
      .lean();

    return res
      .status(200)
      .send({
        status: 200,
        message: "Patient List was successfully fetched",
        data: patientList,
      });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

//@upload document 



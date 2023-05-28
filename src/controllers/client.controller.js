const clientModel = require("../model/client.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const request = require("request");
const sendEmailToUser = require("./../utils/sendEmail");
const nodemailer = require("nodemailer");

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
      companyName: req.user.companyName,
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

exports.reportList = async (req, res) => {
  try {
    console.log("Get the client list !");
    const { role } = req.user;
    if (role === "ADMIN") {
      return res.send({
        status: 403,
        message: "You are not allowed to access this route !",
      });
    }
    // console.log("clientname", req.user.companyName);
    const clientList = await clientModel
      .find({
        companyName: req.user.companyName,
        isDeleted: false,
        cloudinary_id: { $exists: true },
      })
      .select({ companyName: 1, document: 1, cloudinary_id: 1 })
      .lean();

    let finalData = [];
    clientList.map((e, index) => {
      finalData.push({
        // _id: e._id,
        id: index + 1,
        document: e.document,
        uploadedAt: moment(e.createdAt).format("DD-MM-YYYY"),
        category: e.category,
        companyName: e.companyName,
        cloudinary_id: e.cloudinary_id,
      });
    });
    return res.status(200).send({
      status: 200,
      message: "Client Minified List !",
      data: finalData,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.addclient = async (req, res) => {
  try {
    const { companyName, email, password } = req.body;
    if (!companyName || !email || !password) {
      return res
        .status(200)
        .send({ status: 200, message: "Please enter complete details" });
    }
    const _password = password;

    const salt = bcrypt.genSaltSync(parseInt(10));
    const hashPassword = bcrypt.hashSync(password, salt);

    const newClient = await clientModel.create({
      companyName: companyName,
      email: email.toLowerCase(),
      password: hashPassword,
    });
    let isEmailSend
    if (newClient) {
       isEmailSend = await this.sendEmailToUser(
        companyName,
        email,
        _password
      );
    }
    if(isEmailSend.accepted) {
      return res.status(201).send({
        status: 201,
        message: "Client added successfully & Email Sent",
        data: newClient,
      });
    }
  
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.sendEmailToUser = async (companyName, email, _password) => {
  try {
    console.log("Sending email in progress..");

    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
      }
      h1 {
        color: #333;
      }
      p {
        color: #666;
      }
    </style>
  </head>
  <body>
    <h1>Greetings from Thakur Hospital !</h1>
    <p>Please find the credentials below : </p>
    <p>Username: ${email}</p>
    <p>Password: ${_password}</p>
    <p><a href="https://thakurhospital.in">Login Here.</a></p>
  </body>
  </html>
`;

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "singhvlsiayush@gmail.com",
        pass: "tdqxiktfcdijptew",
      },
    });

    // Define the email options
    const mailOptions = {
      from: "singhvlsiayush@gmail.com",
      to: email,
      subject: "My First Email",
      html: htmlContent,
    };

    // Send the email using the transporter
    const result = await transporter.sendMail(mailOptions);
    // console.log("result: " + JSON.stringify(result))
    return result;
    // Return a success response

  } catch (err) {
    console.log(err);
  }
};

exports.downloadFile = async (req, res) => {
  try {
    console.log("Downloading file");
    const fileUrl = req.body.url;

    // Download the file and send it to the client
    request.get(fileUrl).pipe(res);
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};
//@upload document list
exports.documentList = async (req, res) => {
  try {
    // const role = req.user.role;
    let data = await clientModel
      .find({ role: "CLIENT", cloudinary_id: { $exists: true } })
      .select({
        companyName: 1,
        email: 1,
        document: 1,
        cloudinary_id: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .lean();
    let finalData = [];
    data.map((e, index) => {
      finalData.push({
        id: index + 1,
        document: e.document,
        uploadedAt: moment(e.createdAt).format("DD-MM-YYYY"),
        category: "LAB TEST",
        companyName: e.companyName,
        cloudinary_id: e.cloudinary_id,
      });
    });
    return res.status(200).send({
      status: 200,
      message: "Uploaded document list",
      data: finalData,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

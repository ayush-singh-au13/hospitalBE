const clientModel = require("../model/client.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");
// const request = require("request");
const sendEmailToUser = require("./../utils/sendEmail");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// configuring cloudinary
cloudinary.config({
  cloud_name: "dd7lihgvm",
  api_key: "247815895662816",
  api_secret: "GHtlGNP_yWtIFWgnFgJShMj1MJY",
  secure: true,
});

// // Function to upload PDF buffer to Cloudinary
// const uploadBufferToCloudinary = (pdfBuffer) => {
//   // console.log("Uploading", pdfBuffer);
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_large(
//       pdfBuffer,
//       { resource_type: "auto" },
//       (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       }
//     );
//   });
// };

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
    const clientList = await clientModel.aggregate([
      {
        $match: {
          companyName: req.user.companyName,
          isDeleted: false,
          cloudinary_id: { $exists: true },
        },
      },
      { $unwind: "$cloudinary_id" },
      {
        $project: {
          companyName: 1,
          document: "$cloudinary_id.document",
          category: "$cloudinary_id.category",
          clientName: "$cloudinary_id.clientName",
          uploadedAt: "$cloudinary_id.uploadedAt",
        },
      },
      { $sort: { uploadedAt: -1 } },
    ]);

    let finalData = [];
    clientList.map((e, index) => {
      finalData.push({
        id: index + 1,
        _id: e._id,
        uploadedAt: moment(e.uploadedAt).format("DD-MM-YYYY"),
        category: e.category,
        companyName: e.companyName,
        document: e.document,
        category: e.category,
        clientName: e.clientName,
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
    let isEmailSend;
    if (newClient) {
      isEmailSend = await this.sendEmailToUser(companyName, email, _password);
    }
    if (isEmailSend.accepted) {
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

// get the client list
exports.clientList = async (req, res) => {
  try {
    console.log("Client List !");
    let clientData = await clientModel
      .find({ role: "CLIENT", email: { $exists: true } })
      .select({ companyName: 1, email: 1, createdAt: 1 })
      .lean();

    clientData.map((e, index) => {
      e["id"] = index + 1;
      e["createdAt"] = moment(e["createdAt"]).format("DD-MM-YYYY");
    });

    return res
      .status(200)
      .send({ status: 200, message: "Client List !", data: clientData });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};
// get the client list
exports.clientMinifiedList = async (req, res) => {
  try {
    console.log("Client List !");
    let clientData = await clientModel
      .find({ role: "CLIENT", email: { $exists: true } })
      .select({ companyName: 1 })
      .lean();

    return res
      .status(200)
      .send({ status: 200, message: "Client List !", data: clientData });
  } catch (err) {
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
        user: "thakurhospital0657@gmail.com",
        pass: "yqhixurjojncmyqb",
      },
    });

    // Define the email options
    const mailOptions = {
      from: "thakurhospital0657@gmail.com",
      to: email,
      subject: "Login Credential's- Thakur Hospital",
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

// exports.downloadFile = async (req, res) => {
//   try {
//     console.log("Downloading file");
//     const fileUrl = req.body.url;

//     // Download the file and send it to the client
//     request.get(fileUrl).pipe(res);
//   } catch (err) {
//     return res.status(500).send({ status: 500, message: err.message });
//   }
// };
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

// read excel and setting the data to JSON format
exports.readFile = async (req, res) => {
  try {
    console.log("Reading the excel file");

    // console.log("file===>", req.file);
    // Read the uploaded file
    const workbook = XLSX.readFile(req.file.path);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let key = jsonData[0];
    let result = [];

    for (let i = 1; i < jsonData.length; i++) {
      let payload = {};
      for (let j = 0; j < key.length; j++) {
        payload = {
          ...payload,
          [`${key[j]}`]: jsonData[i][j],
        };
      }
      result.push(payload);
    }

    // Send the JSON data in the response
    return res
      .status(200)
      .send({ status: 200, message: "report data", data: result });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.uploadFileCloudinary = async (req, res) => {
  try {
    console.log("Uploading file");

    const element = req.body.htmlContent;
    const companyName = req.body.companyName;
    const category = req.body.category;
    const clientName = req.body.name;

    // console.log("clientName: " + clientName);
    // return;

    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.setContent(element);

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: "A4" });

    const filePath = path.join(__dirname, "temp.pdf");
    fs.writeFileSync(filePath, pdfBuffer);

    // Upload the temporary file to Cloudinary
    cloudinary.uploader
      .upload(filePath, {
        /* upload options */
        folder: "hospital",
      })
      .then(async (result) => {
        // console.log("Cloudinary upload response:", result.secure_url);
        let cloudinary_id = [
          {
            document: result.secure_url,
            category: category,
            clientName: clientName,
            uploadedAt: Date.now(),
          },
        ];

        let update = await clientModel.updateOne(
          { _id: new mongoose.Types.ObjectId(companyName) },
          { $push: { cloudinary_id: { $each: cloudinary_id } } }
        );

        // Handle the upload success
        // Delete the temporary file if needed
        fs.unlinkSync(filePath);
      })
      .catch((error) => {
        console.error("Cloudinary upload error:", error);
        // Handle the upload error
        // Delete the temporary file if needed
        fs.unlinkSync(filePath);
      });
    await browser.close();
    return res.send("File uploaded successfully");

    // Upload the PDF buffer to Cloudinary
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

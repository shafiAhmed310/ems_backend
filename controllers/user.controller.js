const users = require("../db");
const Jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const userCollection = users.db.collection("users");

let smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  auth: {
    user: process.env.Email,
    pass: process.env.password,
  },
});
//sending email

const loginUser = async (req, res,next) => {
  const {
    UserId,
    Password
  } = req.body;
  try {
    const snaps = await userCollection.get();
    if (snaps.docs.length > 0) {
      const user = snaps.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .find((doc) => {
          return doc.UserId === UserId; //comparing hashed password
        });
      if (user) {
      let userType = user.isAdmin;
        if (bcrypt.compareSync(Password, user.Password)) {

          if (user.isAdmin) {
            var token = Jwt.sign({
                ...user,
              },
             process.env.jwtSecret,
              {expiresIn:1800}
            );
            res.json({
              error: false,
              message: "Logged in as Admin",
              token,
              userType
            });
          } else {
            var token = Jwt.sign({
                ...user,
              },
             process.env.jwtSecret,
              {expiresIn:1800}

            );
            res.json({
              error: false,
              message: "Logged in as User",
              token,
              userType
            });
          }
        } else {

          res.status(404).json({
            error: true,
            message: "Invalid Password",
          });
        }
      } else {
        res.status(404).json({
          error: true,
          message: "User does Not Exist!!",
        });
      }
    } else {
      res.status(404).json({
        error: true,
        message: "User does Not Exist!!",
      });
    }

  } catch (err) {
    next(err.message);
  }
};

const getUser = async (req, res,next) => {
  try {
    const snaps = await userCollection.get();
    const user = snaps.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    res.json({
      error: false,
      message: "Users fetched successfully",
      user
    })
  } catch (err) {
    next(err.message);
  }
}

const registerUser = async (req, res,next) => {
  const {
    UserId,
    UserName,
    Email,
    Password,
    isAdmin
  } = req.body;
  console.log(UserId, UserName, Email, Password, isAdmin);
  try {
    const snaps = await userCollection.get();
    const userLength = snaps.docs.length;
    if (userLength < 5) {
      const Userid = snaps.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .find((doc) => {
          return doc.UserId === UserId;
        });
      const email = snaps.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .find((doc) => {
          return doc.Email === Email;
        });
      if (Userid) {
        res.status(400).json({
          error: true,
          message: `UserID: ${UserId} already exists`
        })
      } else if (email) {
        res.status(400).json({
          error: true,
          message: "Email already exists"
        })
      } else {
        let docRef = userCollection.doc()
        await docRef.set({
          UserId: UserId,
          UserName: UserName,
          Email: Email,
          Password: await bcrypt.hash(Password, saltRounds), //hashing Password while registering
          isAdmin: false,
          resetFlag: false
        });
        let mailOptions = {
          from: process.env.Email,
          to: req.body.Email,
          subject: "Register Successful",
          html: `Thanks for registering`
        }
        smtpTransport.sendMail(mailOptions, (error) => {
          if (error) {
           next(error)
          } 
        })
        res.json({
          error: false,
          message: "User Added Successfully"
        })
      }
    } else {
      res.status(400).json({
        error: true,
        message: "User have Exceeds. Please delete Old User to add New User"
      })
    }
  } catch (err) {
    next(err.message);
  }
}

const updateUserPassword = async (req, res,next) => {
  const {
    UserId,
    Password,

  } = req.body
  try {
    const snaps = await userCollection.get();
    const user = snaps.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).find((doc) => { 
      return doc.UserId === UserId
    });
 
    if (user) {
      const salt = bcrypt.genSaltSync(10);
      const encryptedPassword = bcrypt.hashSync(Password, salt)
      const Id = user.id;
      await userCollection.doc(Id).update({
        "Password": encryptedPassword,
        "resetFlag": false
      });
      let mailOptions = {
        from: process.env.Email,
        to: user.Email,
        subject: "Password has been updated",
        html: `Hi ${user.UserName} your  password is successfully updated for your User Id ${user.UserId} and password is ${Password}`
      }
      smtpTransport.sendMail(mailOptions, (error) => {
        if (error) {
          next(error)
         } 
      })
      res.json({
        error: false,
        message: "Password Updated Successfully"
      })
    } else {
      res.status(404).json({
        error: true,
        message: "Invalid User ID"
      })
    }
  } catch (err) {
    next(err.message);
  }
}


const editUser = async (req, res,next) => {
  const {
    UserName,
    Email,
    isAdmin
  } = req.body;
  const Id = req.params.id;
  try {
    const snaps = await userCollection.get();

    const user = snaps.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .find((doc) => {
        return doc.id === Id;
      });
    console.log(snaps.docs);
    if (user) {
      const Id = req.params.id;
      const UpdatedResponse = await userCollection.doc(Id).update({
        UserName: UserName,
        Email: Email,
        isAdmin: isAdmin,
      });
      res.json({
        error: false,
        message: "Details Updated Successfully",
        response: UpdatedResponse,
      });
    } else {
      res.status(404).json({
        error: true,
        message: "UserId Does Not Match",
      });
    }
  } catch (err) {
    next(err.message);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const Id = req.params.id
    console.log(Id);
    const snaps = await userCollection.get();
    const user = snaps.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).find((doc) => {
      return doc.id === Id
    });
    if (user) {
      console.log(true);
      await userCollection.doc(Id).delete();
      res.json({
        error: false,
        message: "User Deleted"
      })
    } else {
      res.status(404).json({
        error: true,
        message: "User does not Exist!!!!"
      })
    }
  } catch (err) {
    next(err.message);
  }
}

const resetRequest = async (req, res,next) => {
  const {
    UserId,
  } = req.body;
  try {
   
    if (UserId) {
      console.log(UserId);
      const snaps = await userCollection.get();
      const user = snaps.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })).find((doc) => {
        return doc.UserId === UserId
      });
      if (user) {
        const Id = user.id;
        const UpdatedResponse = await userCollection.doc(Id).update({
          "resetFlag": true
        });
        let mailOptions = {
          from:process.env.Email,
          to: ["payyavula.r@testyantra.com", "prasadkv1964@gmail.com",process.env.Email],
          subject: "Requesting for password reset",
          html: `Requesting for password reset for UserId : ${user.UserId},<a href="https://khattapani-test.web.app/updatepassword/${UserId}">click here for Reset Password </a>`
        }
        smtpTransport.sendMail(mailOptions, (error) => {
          if (error) {
          next(error)
          } 
        })
        res.json({
          error: false,
          message: "Reset has been Notified to the Admin"
        })
      } else {
        res.status(400).json({
          error: true,
          message: "UserId Does Not Match"
        })
      }
    } else {
      res.status(400).json({
        error: true,
        message: "Please Provide UserID!!!!"
      })
    }
  } catch (err) {
    next(err.message);
  }
};

module.exports = {
  loginUser,
  getUser,
  registerUser,
  editUser,
  resetRequest,
  deleteUser,
  updateUserPassword
}
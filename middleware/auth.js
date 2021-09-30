const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  let token = req.headers.authorization;
  if (!token)
    return res
      .status(401)
      .json({ error: true, message: "Access Denied / Unauthorized request" });

  try {
    token = token.split(" ")[1];
    if (token === null || !token)
      return res
        .status(401)
        .json({ error: true, message: "Access Denied / Unauthorized request" });

    jwt.verify(token, process.env.jwtSecret, (err, data) => {
      if (err) {
        return res.status(401).json({
          error: true,
          message: "Access Denied / Unauthorized request",
        });
      } else {
        next();
      }
    });
  } catch (err) {
     res.status(401).json({
      error: true,
      message: "Access Denied / Unauthorized request",
    });
  }
};

module.exports = {
  auth,
};

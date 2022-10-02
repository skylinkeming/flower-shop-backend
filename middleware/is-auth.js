const jwt = require("jsonwebtoken");

function throwNotAuthenticated() {
  const error = new Error("Not authenticated.");
  error.statusCode = 401;
  throw error;
}

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throwNotAuthenticated();
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "flowershop");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    throwNotAuthenticated();
  }
  req.userId = decodedToken.userId;
  next();
};

import jwt from "jsonwebtoken";
import userModel from "../models/userModel.mjs";
import { secretToken } from "../../config.mjs";

const authentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "Failed",
        message: "Authorization header missing",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "Failed",
        message: "Invalid token format",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "Failed",
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, secretToken);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: "Failed",
      message: "Invalid or Expired Token",
    });
  }
};

const authorization = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: "Failed",
          message: "Unauthorized",
        });
      }

      const user = await userModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          status: "Failed",
          message: "User not found",
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          status: "Failed",
          message: "Access Denied",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        status: "Failed",
        message: error.message,
      });
    }
  };
};

export { authentication, authorization };
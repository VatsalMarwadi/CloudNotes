import mongoose from "mongoose";

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing ${paramName}`,
      });
    }

    next();
  };
};

export default validateObjectId;
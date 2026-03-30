import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
  });
};

export default errorHandler;

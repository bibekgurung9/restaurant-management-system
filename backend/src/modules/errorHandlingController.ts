import { Request, Response, NextFunction } from "express";
import { failureResponse } from "../helpers/responseHelpers";

const handle404Error = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error("Not Found");
  (error as any).status = 404; // Assigning status to error using type assertion
  next(error);
};

const handleGeneralError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  failureResponse(
    res,
    error.message || "Internal Server Error",
    error.status || 500
  );
};

export { handle404Error, handleGeneralError };
import { errorResponse } from '../utils/response.utils.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return errorResponse(res, error.details[0].message, 400);
    next();
  };
};
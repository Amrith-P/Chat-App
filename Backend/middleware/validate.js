// Zod Validation Middleware Wrapper

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed; // assign sanitized/parsed value back
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const issues = (error.issues || error.errors || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: issues,
        });
      }
      next(error);
    }
  };
};

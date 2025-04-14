// Logger simplificado para o frontend
const logger = {
  info: (message: string, meta?: object) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, meta);
    }
  },
  warn: (message: string, meta?: object) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(message, meta);
    }
  },
  error: (message: string, meta?: object) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(message, meta);
    }
  }
};

export default logger; 
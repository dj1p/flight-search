import pino from 'pino';

export default pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: label => ({ level: label }),
  },
  base: { service: 'flight-mcp' },
});

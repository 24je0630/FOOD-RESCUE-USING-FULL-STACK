const app = require('./src/app');
const env = require('./src/config/env');

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Food Rescue API running on port ${PORT} in ${env.NODE_ENV} mode.`);
});

require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`AgroConnect BF API running on port ${PORT}`);
    console.log(`Swagger : http://localhost:${PORT}/api/docs`);
    console.log(`Health : http://localhost:${PORT}/api/health`);
  });
});

import app from "./app.js";
import dotenv from "dotenv";
import 'dotenv/config'


dotenv.config();  

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

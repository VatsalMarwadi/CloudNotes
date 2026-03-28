import dotenv from "dotenv";

dotenv.config();

/* ================= ENV VARIABLES ================= */

const URI = process.env.MONGODB;
const port = Number(process.env.PORT) || 8000;
const secretToken = process.env.SECRET_TOKEN;

const cloudName = process.env.CLOUD_NAME;
const cloudApiKey = process.env.CLOUD_API_KEY;
const cloudApiSecret = process.env.CLOUD_API_SECRET;

/* ================= ENV VALIDATION ================= */

if (!URI) {
  console.error("❌ MONGODB URI is missing in .env file");
  process.exit(1);
}

if (!secretToken) {
  console.error("❌ SECRET_TOKEN is missing in .env file");
  process.exit(1);
}

if (!cloudName || !cloudApiKey || !cloudApiSecret) {
  console.error("❌ Cloudinary credentials are missing in .env file");
  process.exit(1);
}

/* ================= EXPORTS ================= */

export { URI, port, secretToken, cloudName, cloudApiKey, cloudApiSecret };
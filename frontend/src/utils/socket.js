// frontend/src/utils/socket.js
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE = API.replace(/\/api$/, ""); // remove /api if present

const socket = io(BASE, { transports: ["websocket"] });

export default socket;

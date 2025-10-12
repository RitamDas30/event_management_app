// import { io } from "socket.io-client";

// const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// const socket = io(API, { 
//     transports: ["websocket", "polling"], 
// });

// export default socket;






import { io } from "socket.io-client";
const SOCKET_ROOT_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const socket = io(SOCKET_ROOT_URL, { 
    transports: ["websocket", "polling"], 
    withCredentials: true,
});

export default socket;
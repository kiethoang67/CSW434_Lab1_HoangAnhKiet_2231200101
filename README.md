# Practice Assignment 1 - CSW 434: Group Chat App with Real-Time Feature

**Student Name:** HOANG ANH KIET  
**Student ID:** 2231200101  
**Course:** Advanced Mobile Programming (CSW 434)  

---

## Project Structure

```
Lab1/
├── server/             # WebSocket Backend Server (Node.js)
│   ├── src/
│   │   └── server.js   # Server logic handling real-time messaging
│   └── package.json
├── GroupChatMobile/    # Mobile Client (React Native)
│   ├── src/
│   │   ├── config/     # Server connection configuration
│   │   ├── screens/    # Chat Screen
│   │   └── services/   # WebSocket service & event listener
│   ├── App.tsx
│   └── package.json
```

---

## How to Run

### 1. Start the Server
```bash
cd server
npm install
node src/server.js
```
The server will start listening on port `8080`.

### 2. Start the Mobile Client
```bash
cd GroupChatMobile
npm install
npx react-native start
```

In another terminal:
```bash
npx react-native run-android
```
Launch on two emulators or devices to test real-time chat.

# Coding Battle

A real-time **1v1 competitive coding platform** where users can compete against each other (or an AI bot) by solving coding problems. The platform includes matchmaking, live code syncing, an ELO rating system, private rooms, and a clean coding interface powered by Monaco Editor.

The goal of this project is to make competitive programming more interactive by adding a multiplayer gaming experience to coding contests.

---

## Features

- Real-time 1v1 coding battles
- AI Bot opponent (AlphaCode_AI)
- ELO-based matchmaking
- Private rooms with invite codes
- Dynamic ELO rating updates
- Monaco Editor integration
- Live opponent progress updates
- Automatic code execution and verdicts
- Global leaderboard
- User profiles with match history and statistics
- Responsive UI with smooth animations

---

## 🛠 Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS
- Framer Motion
- GSAP
- Monaco Editor
- Socket.IO Client

### Backend

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs

---

## 📂 Project Structure

```text
Coding-Battle-/

backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── socket/
└── server.js

frontend/
├── public/
└── src/
    ├── components/
    ├── hooks/
    ├── layouts/
    ├── pages/
    ├── styles/
    └── utils/
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/akshitbansal2005/Coding-Battle-.git
cd Coding-Battle-
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/codearena
JWT_SECRET=your_secret_key
```

Run the backend:

```bash
npm run dev
```

Backend:

```
http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```
http://localhost:3000
```

---

## API Routes

### Authentication

| Method | Route |
|---------|-------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |

### Users

| Method | Route |
|---------|-------|
| GET | `/api/users/leaderboard` |
| GET | `/api/users/:username` |

### Matches

| Method | Route |
|---------|-------|
| GET | `/api/matches/:id` |
| GET | `/api/matches/user/:userId` |

---

## Socket Events

### Client Events

- join-matchmaking
- leave-matchmaking
- start-bot-match
- create-private-room
- join-private-room
- player-ready
- code-sync
- submit-solution
- forfeit-match

### Server Events

- queue-status
- match-found
- battle-start
- countdown-start
- opponent-code-sync
- submission-verdict
- opponent-submission
- match-ended

---

## 🚀 How It Works

1. Register or log in.
2. Select the platform, difficulty, and topic.
3. Find a match or play against the AI Bot.
4. Wait for matchmaking.
5. Solve the coding problem.
6. Submit your solution.
7. The first player to pass all test cases wins.
8. ELO ratings are updated after every match.

---

## 📚 What I Learned

Building this project helped me improve my understanding of:

- Real-time communication with Socket.IO
- REST API development using Express.js
- JWT-based authentication
- MongoDB database design
- Code execution workflow
- ELO rating implementation
- State management for multiplayer applications
- Building responsive interfaces using Next.js and Tailwind CSS

---

## Future Improvements

Some features planned for future versions include:

- Team battles (2v2)
- Contest mode
- Friends system
- In-game chat
- Daily coding challenges
- Achievement badges
- More coding platforms
- Analytics dashboard

---

## Contributing

Contributions are welcome.

```bash
Fork the repository
Create a new branch
Commit your changes
Open a Pull Request
```

---

## License

This project is licensed under the MIT License.

---

## Author

**Akshit Bansal**

GitHub: https://github.com/akshitbansal2005

If you found this project useful, consider giving it a ⭐.

// server/api/users.js
export default function handler(req, res) {
  const users = [
    { id: 1, name: "You", password: "you" },
    { id: 2, name: "Sarah Johnson", password: "sarah" },
    { id: 3, name: "Alice", password: "alice" },
    { id: 4, name: "Bob", password: "bob" },
  ];
  res.status(200).json(users);
}

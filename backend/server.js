const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();
const SECRET = "mon_secret_ultra_sur";

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const MONGO_URI = "mongodb+srv://czionnix_db_user:EQ61X1nVF7wIMJJF@cluster0.xiywkox.mongodb.net/linktree?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connecté à MongoDB Atlas"))
    .catch(err => console.error("❌ Erreur de connexion MongoDB:", err));

const User = mongoose.model('User', {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Link = mongoose.model('Link', {
    title: String,
    url: String,
    order: Number
});

const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send("Accès refusé");

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        res.status(403).send("Token invalide");
    }
};

// --- ROUTE LOGIN SÉCURISÉE ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // On cherche uniquement si l'utilisateur existe
        const user = await User.findOne({ username });

        // Si l'utilisateur n'existe PAS, on refuse direct (on n'en crée plus !)
        if (!user) {
            console.log(`Tentative de connexion refusée : ${username}`);
            return res.status(401).send("Identifiants incorrects");
        }

        // Si l'utilisateur existe, on compare le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
            return res.json({ token });
        } else {
            return res.status(400).send("Identifiants incorrects");
        }
    } catch (err) { 
        res.status(500).send("Erreur serveur"); 
    }
});

app.get('/api/links', async (req, res) => {
    const links = await Link.find().sort({ order: 1 });
    res.json(links);
});

app.post('/api/links', auth, async (req, res) => {
    const link = new Link({ ...req.body, order: Date.now() });
    await link.save();
    res.json(link);
});

app.delete('/api/links/:id', auth, async (req, res) => {
    await Link.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API lancée sur le port ${PORT}`));

module.exports = app;
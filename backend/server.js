const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();
const SECRET = "mon_secret_ultra_sur";

// CONFIGURATION CORS DÉTAILLÉE
app.use(cors({
    origin: '*', // Autorise ton site Vercel à communiquer avec Render
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] // Autorise explicitement le Token
}));

app.use(express.json());

// --- CONNEXION MONGODB ---
const MONGO_URI = "mongodb+srv://czionnix_db_user:EQ61X1nVF7wIMJJF@cluster0.xiywkox.mongodb.net/linktree?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connecté à MongoDB Atlas"))
    .catch(err => console.error("❌ Erreur de connexion MongoDB:", err));

// --- MODÈLES ---
const User = mongoose.model('User', {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Link = mongoose.model('Link', {
    title: String,
    url: String,
    order: Number
});

// --- MIDDLEWARE AUTH ---
const auth = (req, res, next) => {
    // On récupère le token dans le header Authorization
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        console.log("Tentative d'accès sans token");
        return res.status(401).send("Accès refusé");
    }

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        console.log("Token invalide ou expiré");
        res.status(403).send("Token invalide");
    }
};

// --- ROUTES ---

// Inchangé, mais vérifie bien que tu te connectes pour générer le token
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            const hash = await bcrypt.hash(password, 10);
            user = new User({ username, password: hash });
            await user.save();
        }
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
            return res.json({ token });
        }
        res.status(400).send("Identifiants incorrects");
    } catch (err) { res.status(500).send("Erreur serveur"); }
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
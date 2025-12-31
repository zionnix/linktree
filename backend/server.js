const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Datastore = require('nedb-promises');

const app = express();
const dbLinks = Datastore.create({ filename: 'links.db', autoload: true });
const dbUsers = Datastore.create({ filename: 'users.db', autoload: true });
const SECRET = "mon_secret_ultra_sur";

app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send("Accès refusé");
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch { res.status(403).send("Token invalide"); }
};

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    let user = await dbUsers.findOne({ username });
    if (!user) {
        const hash = await bcrypt.hash(password, 10);
        user = await dbUsers.insert({ username, password: hash });
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(400).send("Identifiants incorrects");
});

app.get('/api/links', async (req, res) => {
    const links = await dbLinks.find({}).sort({ order: 1 });
    res.json(links);
});

app.post('/api/links', auth, async (req, res) => {
    const link = await dbLinks.insert({ ...req.body, order: Date.now() });
    res.json(link);
});

app.delete('/api/links/:id', auth, async (req, res) => {
    await dbLinks.remove({ _id: req.params.id });
    res.json({ success: true });
});

app.listen(3000, () => console.log("✅ API lancée sur http://localhost:3000"));
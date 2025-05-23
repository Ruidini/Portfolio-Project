const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'simple-secret',
    resave: false,
    saveUninitialized: false
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // MySQL user name
    password: 'Databases123', // MySQL password
    database: 'simple_app'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Routes

// Home Page
app.get('/', (req, res) => {
    const user = req.session.user;
    res.render('home', { user });
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user account already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).send('Database error.');
        if (results.length > 0) {
            return res.send('User already exists. Try logging in.');
        }

        // Hash the password and save the user
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
            [username, email, hashedPassword], 
            (err) => {
                if (err) return res.status(500).send('Error registering user.');
                res.redirect('/login');
            }
        );
    });
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user account exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.send('Invalid credentials.');
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.send('Invalid credentials.');
        }

        // Save user info in session
        req.session.user = { id: user.id, username: user.username, email: user.email };
        res.redirect('/');
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
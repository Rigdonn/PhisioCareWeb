const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({ login });

        if (!user) {
            return res.render('login', { errores: { generic: "User or password are incorrect" }, data: req.body });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.render('login', { errores: { generic: "User or password are incorrect" }, data: req.body });
        }

        req.session.usuario = user.login;
        req.session.rol = user.rol;

        if (user.rol === 'patient') {
            return res.redirect(`/patients/${user._id}`);
        } else {
            return res.render('base');
        }
    } catch (error) {
        console.error(error);
        return res.render('login', { errores: { generic: "Something went wrong. Please try again." }, data: req.body });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar la sesión.');
        }
        res.redirect('/');
    });
});

module.exports = router;

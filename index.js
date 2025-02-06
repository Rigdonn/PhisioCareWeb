// Carga de librerías
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const nunjucks = require("nunjucks");
const session = require('express-session');
const methodOverride = require('method-override');


dotenv.config();

// Enrutadores
const patients = require(__dirname + '/routes/patients');
const physios = require(__dirname + '/routes/physios');
const records = require(__dirname + '/routes/records');
const auth = require(__dirname + '/routes/auth');

// Conectar con la base de datos MongoDB
mongoose.connect(process.env.DATABASE_URL);

// Inicializar Express
let app = express();
let router = express.Router();

nunjucks.configure('views', {
    autoescape: true,
    express: app
});
app.set('view engine', 'njk');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        let method = req.body._method;
        delete req.body._method;
        return method;
    }
}));


// Cargar enrutadores
app.use('/patients', patients);
app.use('/physios', physios);
app.use('/records', records);
app.use('/public', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/auth', auth);
app.use('/', router);

router.get("/", (req, res) => {
    res.render('base.njk');
});

// Puesta en marcha del servidor
app.listen(process.env.PUERTO);

let autenticacion = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    } else {
        res.render('login');
    }
};

let rol = (roles) => {
    return (req, res, next) => {
        if (roles.includes(req.session.rol)) {
            res.locals.unauthorized = false;
            console.log('Unauthorized initially:', res.locals.unauthorized);
            return next();
        } else {
            res.locals.unauthorized = true;
            console.log('Unauthorized after check:', res.locals.unauthorized);
            return next();
        }
    };
};

module.exports = {
    autenticacion: autenticacion,
    rol: rol,
};

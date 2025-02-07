const express = require('express');
const bcrypt = require('bcrypt');
const upload = require(__dirname + '/../utils/upload.js');
const User = require(__dirname + '/../models/user');
const auth = require(__dirname + '/../auth/auth');
let Physio = require(__dirname + '/../models/physio.js');
let router = express.Router();

// Servicio de listado
router.get('/', auth.autenticacion, auth.rol('admin'), (req, res) => {
    Physio.find().then(result => {
        if (result.length > 0) {
            res.render('physios_list', { physios: result });
        } else {
            res.render('error.njk', { error: "No hay fisios en el sistema" });
        }
    }).catch(error => {
        res.render('error.njk', { error: error });
    });
});


// Servicio para buscar fisioterapeutas por especialidad
router.get('/find', auth.autenticacion, auth.rol('admin'), (req, res) => {
    const { specialty } = req.query;

    let query = specialty ? { specialty: { $regex: specialty, $options: 'i' } } : {};

    Physio.find(query).then(result => {
        if (result.length > 0) {
            res.render('physios_list', { physios: result });
        } else {
            res.render('error.njk', { error: 'No se encontraron fisios con esos criterios.' });
        }
    }).catch(error => {
        res.render('error.njk', { error: 'Hubo un error con tu búsqueda. Intenta más tarde.' });
    });
});


router.get('/new', auth.autenticacion, auth.rol('admin'), (req, res) => {
    res.render('physio_add');
});

router.get('/:id/edit', auth.autenticacion, auth.rol('admin'), async (req, res) => {
    let result = await Physio.findById(req.params.id);
    res.render('physio_edit', { data: result });
});

// Servicio de fisioterapeuta específico
router.get('/:id', auth.autenticacion, auth.rol('admin'), (req, res) => {
    Physio.findById(req.params.id).then(result => {
        if (result) {
            res.render('physio_detail', { physio: result });
        } else {
            res.render('error.njk', { error: "El fisio no se ha encontrado." });
        }
    }).catch(error => {
        res.render('error.njk', { error: "Error interno del servidor" });
    });
});


// Servicio para insertar un nuevo fisioterapeuta
router.post('/', auth.autenticacion, auth.rol('admin'), upload.upload.single('image'), async (req, res) => {
    try {
        const { name, surname, specialty, licenseNumber, login, password } = req.body;

        if (!name || !surname || !specialty || !licenseNumber || !login || !password) {
            return res.status(400).send({ error: "Faltan campos obligatorios" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUser = new User({
            login,
            password: hashedPassword, // Contraseña encriptada
            rol: 'physio'
        });

        let newPhysio = new Physio({
            name,
            surname,
            specialty,
            licenseNumber,
        });

        if (req.file) {
            newPhysio.image = req.file.filename;
        }

        let savedUser = await newUser.save();
        
        newPhysio._id = savedUser._id;

        await newPhysio.save();

        res.redirect('/physios');

    } catch (error) {
        console.error(error);

        let errores = {
            general: 'Error al guardar el nuevo fisioterapeuta'
        };
        if (error.errors) {
            if (error.errors.name) {
                errores.name = error.errors.name.message;
            }
            if (error.errors.surname) {
                errores.surname = error.errors.surname.message;
            }
            if (error.errors.specialty) {
                errores.specialty = error.errors.specialty.message;
            }
            if (error.errors.licenseNumber) {
                errores.licenseNumber = error.errors.licenseNumber.message;
            }
            if (error.errors.login) {
                errores.login = error.errors.login.message;
            }
            if (error.errors.password) {
                errores.password = error.errors.password.message;
            }
        }

        res.render('physio_add', { errors: errores, data: req.body });
    }
});


router.post('/:id', upload.upload.single('image'), async (req, res) => {
    try {

        let result = await Physio.findById(req.params.id);

        result.name = req.body.name;
        result.surname = req.body.surname;
        result.specialty = req.body.specialty;
        result.licenseNumber = req.body.licenseNumber;
        if (req.file) {
            result.image = req.file.filename;
        }
        await result.save();
        res.redirect(`/physios/${req.params.id}`);

    } catch (error) {

        let errores = {
            general: 'Error saving the new Patient'
        };
        if (error.errors.name) {
            errores.name = error.errors.name.message;
        }
        if (error.errors.surname) {
            errores.surname = error.errors.surname.message;
        }
        if (error.errors.birthDate) {
            errores.birthDate = error.errors.birthDate.message;
        }
        if (error.errors.address) {
            errores.address = error.errors.address.message;
        }
        if (error.errors.insuranceNumber) {
            errores.insuranceNumber = error.errors.insuranceNumber.message;
        }

        res.render('patient_add', { errors: errores, datos: req.body });
    }
});


// Servicio para actualizar los datos de un fisioterapeuta existente
router.put('/:id', auth.autenticacion, auth.rol('admin'), upload.upload.single('image'), async (req, res) => {
    try {
        const { name, surname, specialty, licenseNumber } = req.body;

        if (!name || !surname || !specialty || !licenseNumber) {
            return res.status(400).send({ error: "Faltan campos obligatorios" });
        }

        let updatedPhysio = {
            name,
            surname,
            specialty,
            licenseNumber
        };

        if (req.file) {
            updatedPhysio.image = req.file.filename;
        }

        let result = await Physio.findByIdAndUpdate(req.params.id, { $set: updatedPhysio }, { new: true, runValidators: true });

        if (result) {
            res.redirect(`/physios/${req.params.id}`);
        } else {
            res.status(400).send({ error: "No se ha encontrado el fisioterapeuta para actualizar" });
        }
    } catch (error) {
        console.error(error);

        let errores = {
            general: 'Error actualizando el fisioterapeuta'
        };
        if (error.errors) {
            if (error.errors.name) {
                errores.name = error.errors.name.message;
            }
            if (error.errors.surname) {
                errores.surname = error.errors.surname.message;
            }
            if (error.errors.specialty) {
                errores.specialty = error.errors.specialty.message;
            }
            if (error.errors.licenseNumber) {
                errores.licenseNumber = error.errors.licenseNumber.message;
            }
        }

        res.status(400).render('physio_edit', { errors: errores, data: req.body });
    }
});


// Servicio para eliminar un fisioterapeuta
router.delete('/:id', auth.autenticacion, auth.rol('admin'), async (req, res) => {
    try {
        const deletedPhysio = await Physio.findByIdAndDelete(req.params.id);

        if (!deletedPhysio) {
            return res.render('error.njk', { error: "No se ha encontrado el fisioterapeuta para eliminar" });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.render('error.njk', { error: "No se ha encontrado el usuario para eliminar" });
        }

        res.redirect(req.baseUrl);

    } catch (error) {
        console.error(error);
        res.render('error.njk', { error: "Hubo un error al intentar eliminar el fisioterapeuta y su usuario asociado." });
    }
});


module.exports = router;

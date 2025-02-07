const express = require('express');
const bcrypt = require('bcrypt');
let Patient = require(__dirname + '/../models/patient.js');
const User = require(__dirname + '/../models/user');
const upload = require(__dirname + '/../utils/upload.js');
const auth = require(__dirname + '/../auth/auth');
let router = express.Router();

// Servicio de listado

router.get('/', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    Patient.find()
        .then(result => {
            if (result.length > 0) {
                res.render('patients_list', { patients: result });
            } 
            else {
                res.render('error', { error: "No hay pacientes en el sistema" });
            }
        })
        .catch(error => {
            res.render('error', { error: error });
        });
});

router.get('/new', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    res.render('patient_add');
});

// Servicio para buscar pacientes por apellido
router.get('/find', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    const { surname } = req.query;

    let query = surname ? { surname: { $regex: surname, $options: 'i' } } : {};
    console.log(query);

    Patient.find(query)
        .then(result => {
            if (result.length > 0) {
                res.render('patients_list', { patients: result });
            } else {
                res.render('error', { error: "No se encontraron pacientes con esos criterios." });
            }
        })
        .catch(error => {
            res.render('error', { error: "Hubo un error al buscar pacientes. Inténtalo más tarde." });
        });
});


// Servicio de pacientes especificos
router.get('/:id', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    Patient.findById(req.params.id)
        .then(result => {
            res.render('patient_detail', { patient: result });
        })
        .catch(error => {
            res.render('error', { error: error });
        });
});

router.get('/:id/edit', auth.autenticacion, async (req, res) => {
    let result = await Patient.findById(req.params.id);
    res.render('patient_edit', { data: result });
});


router.post('/', auth.autenticacion, auth.rol(['admin', 'physio']), upload.upload.single('image'), async (req, res) => {
    try {
        const { login, password, name, surname, birthDate, address, insuranceNumber } = req.body;

        if (!login || !password || !name || !surname || !birthDate || !insuranceNumber) {
            return res.status(400).render('patient_add', { 
                errors: { general: "Faltan campos obligatorios" }, 
                datos: req.body 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let newUser = new User({
            login,
            password: hashedPassword,
            rol: 'patient'
        });

        let newPatient = new Patient({
            name,
            surname,
            birthDate,
            address,
            insuranceNumber
        });

        if (req.file) {
            newPatient.image = req.file.filename;
        }

        const savedUser = await newUser.save();
        newPatient._id = savedUser._id;

        await newPatient.save();

        res.redirect(req.baseUrl);
    } catch (error) {
        console.error(error);

        let errores = {
            general: 'Error guardando el nuevo paciente'
        };
        if (error.errors) {
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
            if (error.errors.login) {
                errores.login = error.errors.login.message;
            }
            if (error.errors.password) {
                errores.password = error.errors.password.message;
            }
        }

        res.status(400).render('patient_add', { errors: errores, datos: req.body });
    }
});


router.post('/:id', upload.upload.single('image'), (req, res) => {
    const { name, surname, birthDate, address, insuranceNumber } = req.body;
    if (!name || !surname || !birthDate || !insuranceNumber) {
        return res.status(400).send({ error: "Faltan campos obligatorios" });
    }
    Patient.findById(req.params.id)
        .then(patient => {
            if (!patient) {
                return Promise.reject({ error: "Paciente no encontrado" });
            }

            patient.name = name;
            patient.surname = surname;
            patient.birthDate = birthDate;
            patient.address = address;
            patient.insuranceNumber = insuranceNumber;

            if (req.file) {
                patient.image = req.file.filename;
            }

            return patient.save();
        })
        .then(updatedPatient => {
            res.redirect(req.baseUrl);
        })
        .catch(error => {
            let errores = {
                general: 'Error actualizando el paciente'
            };

            if (error.errors) {
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
            }

            if (error.error) {
                errores.general = error.error;
            }

            res.render('patient_add', { errors: errores, datos: req.body });
        });
});



// Servicio para actualizar los datos de un paciente existente
router.put('/:id', auth.autenticacion, auth.rol(['admin', 'physio']), upload.upload.single('image'), async (req, res) => {
    try {
        const { name, surname, birthDate, address, insuranceNumber } = req.body;

        if (!name || !surname || !birthDate || !insuranceNumber) {
            return res.status(400).send({ error: "Faltan campos obligatorios" });
        }

        let updatedPatient = {
            name,
            surname,
            birthDate,
            address,
            insuranceNumber
        };

        if (req.file) {
            updatedPatient.image = req.file.filename;
        }

        let result = await Patient.findByIdAndUpdate(req.params.id, { $set: updatedPatient }, { new: true, runValidators: true });

        if (result) {
            res.redirect(`/patients/${req.params.id}`);
        } else {
            res.status(400).send({ error: "Error actualizando los datos del paciente" });
        }
    } catch (error) {
        console.error(error);

        let errores = {
            general: 'Error actualizando el paciente'
        };
        if (error.errors) {
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
        }

        res.status(400).render('patient_edit', { errors: errores, data: req.body });
    }
});


// Servicio para eliminar un paciente
router.delete('/:id', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    Patient.findByIdAndDelete(req.params.id)
        .then(() => {
            return User.findByIdAndDelete(req.params.id);
        })
        .then(() => {
            res.redirect(req.baseUrl);
        })
        .catch(error => {
            res.render('error', { error: error });
        });
});

module.exports = router;
const express = require('express');
const Record = require(__dirname + "/../models/record");
const Patient = require(__dirname + "/../models/patient");
const Physio = require(__dirname + "/../models/physio");
const auth = require(__dirname + '/../auth/auth');
let router = express.Router();

// Servicio de listado
router.get('/', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    Record.find()
        .populate('patient')
        .then(records => {
            res.render('records_list', { records });
        })
        .catch(error => {
            res.render('error.njk', { error: 'Hubo un error al cargar los registros. Inténtalo de nuevo más tarde.' });
        });
});

// Servicio para crear un nuevo expediente médico
router.get('/new', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    Patient.find().select('name surname _id')
        .then(patients => {
            res.render('record_add', { patients, errors: {}, data: {} });
        })
        .catch(error => {
            res.render('error', { error: 'No se pudo cargar el formulario para añadir el expediente. Inténtalo de nuevo más tarde.' });
        });
});

router.get('/:id/appointments/new', auth.autenticacion, auth.rol(['admin', 'physio']), async (req, res) => {
    try {
        let record = await Record.findById(req.params.id).populate('patient');
        if (!record) {
            return res.render('error', { error: 'Expediente no encontrado.' });
        }
        let physios = await Physio.find().select('name surname _id');
        res.render('record_add_appointment', { record, physios, errors: {}, data: {} });
    } catch (error) {
        res.render('error', { error: 'Hubo un error al cargar el formulario de citas. Inténtalo de nuevo más tarde.' });
    }
});



// Servicio para buscar expedientes por nombre de paciente
router.get('/find', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    const surname = req.query.surname || '';
    
    if (surname) {
        Patient.find({ surname: { $regex: surname, $options: 'i' } })
            .then(patients => {
                if (patients.length === 0) {
                    return res.render('error', { error: 'No se encontraron registros con ese apellido de paciente.' });
                }

                const patientIds = patients.map(patient => patient._id);
                return Record.find({ patient: { $in: patientIds } }).populate('patient');
            })
            .then(results => {
                if (results.length === 0) {
                    return res.render('error', { error: 'No hay expedientes disponibles para ese paciente.' });
                }
                res.render('records_list', { records: results });
            })
            .catch(error => {
                res.render('error', { error: 'Hubo un error con tu búsqueda, por favor intenta de nuevo más tarde.' });
            });
    } else {
        Record.find().populate('patient')
            .then(records => {
                res.render('records_list', { records });
            })
            .catch(error => {
                res.render('error', { error: 'Hubo un error al cargar los registros. Inténtalo de nuevo más tarde.' });
            });
    }
});


// Servicio para obtener detalles de un expediente específico
router.get('/:id', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    const recordId = req.params.id;

    Record.findById(recordId)
        .populate('patient')
        .populate('appointments.physio')
        .then(result => {
            if (result) {
                res.render('record_detail', { record: result });
            } else {
                res.render('error', { error: 'El expediente no se ha encontrado.' });
            }
        })
        .catch(error => {
            res.render('error', { error: 'Hubo un error al cargar el expediente. Inténtalo de nuevo más tarde.' });
        });
});

// Servicio para insertar un expediente médico
router.post('/', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    const { patientId, medicalRecord } = req.body;
    const data = { patientId, medicalRecord };
    const errors = {};

    if (!patientId) errors.patientId = 'Debe seleccionar un paciente.';
    if (!medicalRecord || medicalRecord.trim().length === 0) errors.medicalRecord = 'Se requieren detalles del expediente médico.';
    if (Object.keys(errors).length > 0) {
        Patient.find().select('name surname _id')
            .then(patients => {
                res.render('record_add', { patients, errors, data });
            })
            .catch(error => {
                res.render('error', { error: 'Hubo un error al cargar los pacientes. Inténtalo de nuevo más tarde.' });
            });
    } else {
        Record.findOne({ patient: patientId })
            .then(existingRecord => {
                if (existingRecord) {
                    errors.patientId = 'Este paciente ya tiene un expediente médico.';
                    return Patient.find().select('name surname _id')
                        .then(patients => {
                            res.render('record_add', { patients, errors, data });
                        });
                }

                const newRecord = new Record({
                    patient: patientId,
                    medicalRecord: medicalRecord.trim(),
                    appointments: [],
                });

                return newRecord.save();
            })
            .then(() => {
                res.redirect('/records');
            })
            .catch(error => {
                res.render('error', { error: 'Ocurrió un error al crear el expediente. Inténtalo de nuevo más tarde.' });
            });
    }
});


// Servicio para añadir consultas a un expediente
router.post('/:id/appointments', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    const recordId = req.params.id;
    const { date, physio, diagnosis, treatment, observations } = req.body;
    const data = { date, physio, diagnosis, treatment, observations };
    const errors = {};

    if (!date) errors.date = 'La fecha de la consulta es obligatoria.';
    if (!physio) errors.physio = 'Debe seleccionar un fisioterapeuta.';
    if (!diagnosis || diagnosis.trim().length < 10) errors.diagnosis = 'El diagnóstico debe tener al menos 10 caracteres.';
    if (!treatment || treatment.trim().length === 0) errors.treatment = 'El plan de tratamiento es obligatorio.';

    if (Object.keys(errors).length > 0) {
        Physio.find().select('name _id')
            .then(physios => {
                res.render('record_add_appointment', { recordId, physios, errors, data });
            })
            .catch(error => {
                res.render('error', { error: 'Hubo un error al cargar los fisioterapeutas. Inténtalo de nuevo más tarde.' });
            });
    } else {
        Record.findById(recordId)
            .then(record => {
                if (!record) {
                    return res.render('error', { error: 'El expediente no existe.' });
                }

                record.appointments.push({
                    date: new Date(date),
                    physio,
                    diagnosis: diagnosis.trim(),
                    treatment: treatment.trim(),
                    observations: observations?.trim(),
                });

                return record.save();
            })
            .then(() => {
                res.redirect(`/records/${recordId}`);
            })
            .catch(error => {
                res.render('error', { error: 'Ocurrió un error al añadir la consulta. Inténtalo de nuevo más tarde.' });
            });
    }
});



// Servicio para eliminar un expediente médico
router.delete('/:id', auth.autenticacion, auth.rol(['admin', 'physio']), (req, res) => {
    Record.findByIdAndDelete(req.params.id)
        .then(result => {
            if (result) {
                Record.find().populate('patient')
                    .then(records => {
                        res.render('records_list', { records });
                    })
                    .catch(error => {
                        res.render('error', { error: 'Hubo un error al cargar los registros. Inténtalo de nuevo más tarde.' });
                    });
            } else {
                res.render('error', { error: 'El expediente no se ha encontrado.' });
            }
        })
        .catch(error => {
            res.render('error', { error: 'Hubo un error al eliminar el expediente. Inténtalo de nuevo más tarde.' });
        });
});

module.exports = router;

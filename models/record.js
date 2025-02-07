const mongoose = require('mongoose');

let appointmentsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    physio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'physios',
        required: true
    },
    diagnosis: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
        trim: true
    },
    treatment: {
        type: String,
        required: true
    },
    observations: {
        type: String,
        maxlength: 500,
        trim: true
    }
});

let recordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'patients',
        required: true,
        unique: true
    },
    medicalRecord: {
        type: String,
        maxlength: 1000,
        trim: true
    },
    appointments: [appointmentsSchema]
});

let Record = mongoose.model('records', recordSchema);
module.exports = Record;
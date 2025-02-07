const mongoose = require('mongoose');

let patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'The name is required'],
        minlength: [2, 'It has to be longer than 2 characters'],
        maxlength: [50, 'It cant be longer than 50 characters'],
        trim: true
    },
    surname: {
        type: String,
        maxlength: [50, 'It cant be longer than 50 characters'],
        minlength: [2, 'It has to be longer than 2 characters'],
        required: [true, 'The surname is required'],
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, 'The birth date is required']
    },
    address: {
        type: String,
        maxlength: [100, 'It cant be longer than 100 characters'],
        trim: true
    },
    insuranceNumber: {
        type: String,
        required: [true, 'The insurance number is required'],
        match: [/^[a-zA-Z0-9]{9}$/, 'It needs to be exactly 9 numbers long'],
        unique: [true, 'It cant be duplicated']
    },
    image: {
        type: String,
        required: false
    }
});

let Patient = mongoose.model('patients', patientSchema);
module.exports = Patient;

const mongoose = require('mongoose');

let physioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'The name is required'],
        minlength: [2, 'It has to be longer than 2 characters'],
        maxlength: [50, 'It cant be longer than 50 characters'],
        trim: true
    },
    surname: {
        type: String,
        required: [true, 'The surname is required'],
        minlength: [2, 'It has to be longer than 2 characters'],
        maxlength: [50, 'It cant be longer than 50 characters'],
        trim: true
    },
    specialty: {
        type: String,
        required: [true, 'The specialty is required'],
        enum: ['Sports', 'Neurological', 'Pediatric', 'Geriatric', 'Oncological']
    },
    licenseNumber: {
        type: String,
        required: [true, 'The license number is required'],
        match: [/^[a-zA-Z0-9]{8}$/, 'The license number has to be exactly 8 characters'],
        unique: [true, 'This field cant be repeated']
    },
    image: {
        type: String,
        required: false
    }
});

let Physio = mongoose.model('physios', physioSchema);
module.exports = Physio;

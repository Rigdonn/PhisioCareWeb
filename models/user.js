const mongoose = require('mongoose');

let usersSchema = new mongoose.Schema({
    login: {
        type: String,
        required: [true, 'The username is required'],
        minlength: [4, 'The length has to be greater than 4'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'The password is required'],
        minlength: [4, 'The length has to be greater than 7'],
        trim: true
    },
    rol: {
        type: String,
        required: true,
        enum: ['admin', 'physio', 'patient'],
    },
});



let User = mongoose.model('users', usersSchema);
module.exports = User;
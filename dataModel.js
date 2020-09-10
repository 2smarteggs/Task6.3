let mongoose = require("mongoose");
let validator = require("validator")
let UserSchema = new mongoose.Schema({
    country: String,
    firstName: String,
    lastName: String,
    email: {type: String,
        trim:true,
        lowercase:true,
        validate(value){
            if (!validator.isEmail(value)){
                throw new Error('Email is not valid!')
            }
        }},
    password: {type: String,
        lowercase:true,
        validate(value) {
            if (value.length < 8) {
                console.log(value.length);
                throw new Error('Password should be more than 8 characters!')
            }
        }},
    address: String,
    city: String,
    state: String,
    code: String,
    number: {type: String,
        validate(value) {
            if (value.isNumeric === false) {
                throw new Error('Mobile phone number should consist of pure numbers!')
            }
        }},

});

module.exports = mongoose.model('users', UserSchema);
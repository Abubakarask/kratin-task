const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email Address.");
            }
        }
    },
    password: {
        type: String,
        validate(value) {
            if (value.length < 6) {
                throw new Error("Minimum Password length is 6.");
            }
        }
    },
    medicines:[{
        medicine: {
            type:String
        },
        stock: {
            type:Number
        },
        dosage:{
            type:Number
        }
    }],
    sos_email: {
        type: String,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email Address.");
            }
        }
    },
});


userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign(this._id.toString(), process.env.SECRET_KEY);
        return token;
    } catch (err) {
        throw new Error(err);
    }
}


const User = mongoose.model("Kratin_UserData", userSchema, "Kratin_UserData");

module.exports = User;
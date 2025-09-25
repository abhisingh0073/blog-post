const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const { createTokenForUser } = require('../service/authentication');


const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileUrl : {
        type: String,
        default: '/images/usericon1.png',
    }
}, 
 { timestamps: true }
);



userSchema.static('matchPasswordAndGenerateToken', async function(email, password){
    const user = await this.findOne({email});
    if(!user) throw new Error("user not found");

const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Incorrect password or email");
    }
    
   const token = createTokenForUser(user);
     return token;
});


const User = model('user', userSchema);
module.exports = User;
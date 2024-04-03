const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    firstName:{ type: String, required:[true, 'Please enter first name']},
    lastName:{ type: String, required:[true, 'Please enter last name']},
    email:{ type: String, required:[true, 'Please enter email'], unique:true},
    password:{ type: String, required:[true, 'Please enter password']},
});


//replace plaintext password with hashed password before saving the document in the database
//pre middleware
userSchema.pre('save', function(next){
    let user = this;
    if(!user.isModified('password'))
        return next();
    bcrypt.hash(user.password, 10)
    .then(hash=>{
        user.password = hash;
        next();
    })
    .catch(err=>next(err));
});

userSchema.methods.comparePassword = function(loginPassword) {
    return bcrypt.compare(loginPassword, this.password);
}

module.exports = mongoose.model('User',userSchema);
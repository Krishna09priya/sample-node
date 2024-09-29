const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { 
    type: String, 
    required: [true, 'Name is required'],
    unique: true
 },
  email: {
    type:String,
    required:[true, 'Email field is required']
},
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    
 },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;

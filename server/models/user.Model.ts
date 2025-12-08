import { model, Schema, Types } from 'mongoose';
import { userInterface } from '../interfaces/user.interface';

const userSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profilePicture: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  isSupportAdmin: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const userModel = model<userInterface>('User', userSchema);
export { userModel };
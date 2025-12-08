import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Roleinterface extends Document {
  _id: Types.ObjectId;
  name: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ['admin', 'user']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const roleModel = mongoose.models.Role || mongoose.model<Roleinterface>('Role', RoleSchema);

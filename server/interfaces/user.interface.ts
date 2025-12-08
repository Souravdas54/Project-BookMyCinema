import { Types } from "mongoose";

export interface userInterface {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  phone: number;
  gender: string;
  password: string;
  profilePicture?: string;
  isVerified: boolean;
  role: Types.ObjectId | string;
  refreshToken?: string;
   isSupportAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface userPayload {
  _id?: string;
  name: string;
  email: string;
  role: string;

}
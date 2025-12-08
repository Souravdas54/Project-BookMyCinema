import mongoose, { Schema, Document, model } from 'mongoose';

export interface IMessage {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    message: string;
    type: string; // 'text', 'image', 'file'
    read: boolean;
    readAt?: Date;
    createdAt: Date;
}

export interface IChat extends Document {
    participants: mongoose.Types.ObjectId[];
    messages: IMessage[];
    isSupportChat: boolean;
    lastMessage?: IMessage;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'text'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new Schema<IChat>({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [messageSchema],
    
    isSupportChat: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        type: messageSchema,
        default: null
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

chatSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.messages.length > 0) {
        this.lastMessage = this.messages[this.messages.length - 1];
    }
    next();
});

const chatModel = model<IChat>('Chat', chatSchema);
export { chatModel }
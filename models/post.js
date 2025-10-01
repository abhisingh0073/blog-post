const { Schema, model, default: mongoose } = require('mongoose');

const postSchema = new Schema({
    postTitle:{
        type:String,
        required: true,
    },
    postContent: {
        type: String,
        required: true,
    },
    visibility:{
        type: Boolean,
        default: false,
    },
    coverImage: {
        type: String,
        default:'/uploads/default.jpeg'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    visitors:[
        {
            timestamp: {type: Number}
        }
    ]
}, { timestamps: true })


const Post = model("posts", postSchema);

module.exports = Post;
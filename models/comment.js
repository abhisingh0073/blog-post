const { schema, model, Schema } = require('mongoose');

const commentSchema = new Schema({
    content: {
        type: String,
        require: true,
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: "posts",
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
    }
}, { timestamps: true });

const Comment = model("comment", commentSchema);

module.exports = Comment;
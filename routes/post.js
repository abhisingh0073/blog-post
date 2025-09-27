const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const Post = require('../models/post');
const fs = require('fs');

const route = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/temp');
        fs.mkdirSync(uploadPath, { recursive: true }); // ensure folder exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // unique filename
    }
});

const upload = multer({ storage });

route.post('/create', upload.single('coverImage'), async(req, res) => {
  try {
    const { postTitle, postContent, visibility } = req.body;
let user
    let post = await Post.create({
        postTitle,
        postContent,
        visibility,
        createdBy: req.user._id,

    });

    if (req.file) {
            const userDir = path.join(__dirname, '../public/uploads', req.user._id.toString());
            fs.mkdirSync(userDir, { recursive: true });
        
            const newPath = path.join(userDir, req.file.filename);
        
            // move file from tmp to user-specific folder
            fs.renameSync(req.file.path, newPath);
        
            // update user with image path
            post.coverImage = `/uploads/${req.user._id}/${req.file.filename}`;
            await post.save();
        }  
        console.log(`/public/uploads/${req.user._id}/${req.file.filename}`);
        return res.redirect('/');

    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong');
    }
  
})


route.get('/:id', async (req, res) => {
    const post = await Post.findById(req.params.id).populate("createdBy");
    return res.render('readpost', {
        user: req.user,
        post,
    })
})


module.exports = route;
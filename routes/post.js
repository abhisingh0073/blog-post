const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const Post = require('../models/post');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { timeStamp } = require('console');
const Comment = require('../models/comment');

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

// to create new post
route.post('/create', upload.single('coverImage'), async (req, res) => {
  try {
    const { postTitle, postContent, visibility } = req.body;

    // Simple server-side validation
    if (!postTitle || !postContent) {
      return res.status(400).send("Post title and content are required.");
    }

    // Create post with default coverImage (if schema has default, it's safe)
    let post = await Post.create({
      postTitle,
      postContent,
      visibility: visibility === "true", // convert string to boolean
      createdBy: req.user._id,
      // coverImage will use default if not uploaded
    });

    // Handle uploaded file
    if (req.file) {
      const userDir = path.join(__dirname, '../public/uploads', req.user._id.toString());
      fs.mkdirSync(userDir, { recursive: true });

      const newPath = path.join(userDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);

      post.coverImage = `/uploads/${req.user._id}/${req.file.filename}`;
      await post.save();
    }

    return res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.status(500).send("Something went wrong while creating the post.");
  }
});


// to search particular post
route.get('/search', async(req, res) => {
  try{
    const {searchWord} = req.query
    let message = ""

    if(!searchWord || searchWord.trim() == ""){
      return res.redirect('/');
    }

    const cleanedWord = searchWord.trim();
    const regex = new RegExp(cleanedWord, "i");

    const posts = await Post.find({
      visibility:"true",
      postTitle: regex
    }).populate("createdBy", "fullName profileUrl").sort({createdAt: -1});


    
    if(!posts || posts.length === 0){
        message = `No posts found for "${cleanedWord}"`;
    }

    return res.render('home', {
      posts,
      user: req.user,
      message,
    })
  } catch(err){
    console.error(err);
     return res.status(500).send("Server Error");
  }
})


// read that post
route.get('/:id', async (req, res) => {
    const post = await Post.findByIdAndUpdate(req.params.id, {$push: {
        visitors: { timeStamps: Date.now()}
    }}).populate("createdBy");

    const comments = await Comment.find({postId:req.params.id }).populate('createdBy');

    return res.render('readpost', {
        user: req.user,
        post,
        comments,
    })
})


// to edit the post
route.get('/edit/:id', async (req, res) => {
    const postId = req.params.id
    const post = await Post.findById(postId);

    res.render('editpost', {
        user: res.user,
        post: post,
    })
});

// to edit the post
route.post('/update/:id',upload.single('coverImage'), async(req, res) => {
    const { postTitle, postContent, visibility } = req.body
    const postId = req.params.id

    if( !postTitle || !postContent) {
        return res.status(500).send("Post Title and Post Body is required");
    }

    let post = await Post.findById(postId);
    if(!post) {
        return res.status(404).send("Post is not found")
    }
    
    post.postTitle = postTitle
    post.postContent = postContent
    post.visibility = visibility === "true"

    if(req.file){
        const userDir = path.join(__dirname, '../public/uploads', req.user._id.toString());
        fs.mkdirSync(userDir, { recursive: true});

        if(post.coverImage && post.coverImage !== '/uploads/default.jpeg'){
            const oldPath = path.join(__dirname, '../public', post.coverImage);
            try{
                await fsPromises.unlink(oldPath);
            } catch(err){
                console.warn("Old image not found or already deleted:", err.message);
            }
        }

        const newPath = path.join(userDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);

      // save new path in DB
      post.coverImage = `/uploads/${req.user._id}/${req.file.filename}`;
    }

    await post.save();

    return res.redirect(`/profile/${req.user._id}`);


})


// to delete the post
route.get('/delete/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Only delete if coverImage exists and is not default
    if (post.coverImage && post.coverImage !== '/uploads/default.jpeg') {
      // Build absolute path
      const filePath = path.join(__dirname, '../public', post.coverImage);
      await fsPromises.unlink(filePath).catch(() => {}); 
    }

    await Post.findByIdAndDelete(postId);

    user = req.user;

    return res.redirect(`/profile/${req.user._id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Something went wrong");
  }
});



// to comment the partcular post
route.post('/comment/:postId',async (req, res) => {
  await Comment.create({
    content: req.body.content,
    postId: req.params.postId,
    createdBy: req.user._id,
  });

  return res.redirect(`/post/${req.params.postId}`)
})








module.exports = route;
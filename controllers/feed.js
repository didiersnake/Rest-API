const { validationResult } = require("express-validator/check");

const fs = require("fs");
const path = require("path");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res
        .status(200)
        .json({ message: "fetched post successfully", posts: posts });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  //validate data at server with express validator
  const errors = validationResult(req);
  //if error skip this block (throw error)
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
    s;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: { name: "Maximilian" },
  });
  post
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
      // console.log(err);
    });
};

module.exports = {
  getPost: function (req, res, next) {
    const postId = req.params.postId;
    Post.findById(postId)
      .then((post) => {
        if (!post) {
          const error = new Error("could not find post");
          error.statusCode = 404;
          throw error; //this will pass skip this block and run the catch passing this error as err
        }
        res.status(200).json({ message: "Post fetched", post: post });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  },

  updatePost: function (req, res, next) {
    const postId = req.params.postId;
    //validate data at server (express validator)
    const errors = validationResult(req);
    //if error skip this block (throw error)
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed, entered data is incorrect.");
      error.statusCode = 422;
      throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image; //if no file is picked
    if (req.file) {
      //else file is picked
      imageUrl = req.file.path;
    }
    if (!imageUrl) {
      const error = new Error("No file picked");
      error.statusCode = 422;
      throw error;
    }
    Post.findById(postId)
      .then((post) => {
        if (!post) {
          const error = new Error("could not find post");
          error.statusCode = 404;
          throw error;
        }
        //if file is changed delete old file
        if (imageUrl !== post.imageUrl) {
          clearImage(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        return post.save();
      })
      .then((result) => {
        res.status(200).json({ message: "Post updated!", post: result });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  },

  deletePost: function (req, res, next) {
    const postId = req.params.postId;
    Post.findById(postId)
      .then((post) => {
        if (!post) {
          const error = new Error("could not find post");
          error.statusCode = 404;
          throw error;
        }

        clearImage(post.imageUrl); // delete image
        return Post.findByIdAndRemove(postId);
      })
      .then((result) => res.status(200).json({ message: "Post Deleted!" }))
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  },
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err)); //delete file
};

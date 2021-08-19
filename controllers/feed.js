const { validationResult } = require('express-validator');
const Post = require("../models/tweet");
const User = require("../models/user");


exports.followerspost = (req,res,next)=>{
    const userId = req.userId;
    let posts =[];

    let followers = [];
    User.findById(userId)
    .then(user =>{
        if(!user){
            const error = new Error('user not found!!');
            error.statusCode = 401;
            throw error;
        }
         followers = user.following;
        return Post.find()
    })
    .then(tweets => {
      
        if(!tweets){
            const error = new Error('posts not found!!');
            error.statusCode = 401;
            throw error;
        }
        for(let tweet of tweets){
            const postfollower = followers.find(follower => follower.userId.toString() === tweet.userId.toString());
            if(postfollower){
                posts.push(tweet);
            }
        }
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts
          });


    })
    .catch(err =>{
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    })
};



exports.createTweet = (req,res,next)=>{
    const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  let imageurl;
  if (!req.file) {
     imageurl = "";
  }else{
     imageurl = req.file.path;
  }

  const public = req.body.public;
  const comment = req.body.comment;
  const post = new Post({
    comment: comment,
    imageUrl:imageurl,
    retweet:[],
    comments:[],
    likes:[],
    userId: req.userId,
    public: public
  });
  post
    .save()
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        post: post
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}


exports.searchUser = (req,res,next)=>{
  const userId = req.params.userId;
  if(req.userId == userId){
    const error = new Error('the same user looking for himself');
        error.statusCode = 401;
        throw error;
  }
  let utilisateur;
  User.findById(userId)
  .then(user =>{
    if(!user){
      const error = new Error('Could not find user.');
        error.statusCode = 404;
        throw error;
    }
    utilisateur = {
      username : user.username,
      email : user.email,
      following : user.following,
      followers : user.followers
    }
    const checkFollowingUser = utilisateur.followers.find(follower => follower.userId.toString()=== req.userId.toString());
    if(checkFollowingUser){
      return Post.find({userId : userId});
    }else{
      return Post.find({userId : userId,public : true});
    }
  })
  .then(posts =>{
    if(!posts){
      const error = new Error('Could not find posts.');
        error.statusCode = 404;
        throw error;
    }
    utilisateur.userPosts = posts;
    res.status(200).json({
      message : "found what u are looking for",
      user : utilisateur
    })
  })
  .catch(err =>{
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}


exports.followUser = (req,res,next)=>{
  const userId = req.userId;
  const followingId = req.body.userId;
  let followerUser;
  let user2;
  var checkUserfollowed ;
  User.findById(userId)
  .then(user =>{
    if(!user){
      const error = new Error('Could not find user.');
        error.statusCode = 404;
        throw error;
    }
    followerUser=user;
    return User.findById(followingId)
  })
  .then(user =>{
    if(!user){
      const error = new Error('Could not find following user.');
        error.statusCode = 404;
        throw error;
    }
    checkUserfollowed = user.followers.find(follower => follower.userId.toString() === followerUser._id.toString());
    if(!checkUserfollowed ){
      user2= user;
      user.followers.push({
        userId : followerUser._id,
        username : followerUser.username
      })
      return user.save();
    }
    const error = new Error('alerady followed user.');
    error.statusCode = 404;
    throw error;
  })

  .then(result =>{
    User.findById(req.userId)
    .then(user =>{
      user.following.push({
        userId : user2._id,
        username : user2.username
      })
      return user.save();
    })  
    .then(result =>{
      res.status(200).json({message : "following added succesfully"});
        })  
    
  })
  .catch(err =>{
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}

exports.unfollowUser = (req,res,next)=>{
  const followingId = req.body.followingId;
  User.findById(req.userId)
  .then(user =>{
    if(!user){
      const error = new Error('alerady followed user.');
      error.statusCode = 404;
      throw error;
    }
    const newFollowings = user.following.filter(follow => follow.userId.toString() !== followingId);
    user.following = newFollowings;
    return user.save();
  })
  .then(result =>{
    console.log(followingId);
    return User.findById(followingId)
    
  })
  .then(user => {
    const newFollowers = user.followers.filter(follow => follow.userId.toString() !== req.userId.toString());
    user.followers = newFollowers;
    return user.save();
  })
  .then(result =>{
    res.status(200).json({message : "unfollowing user succesfully"});
  })
  .catch(err =>{
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}

exports.getbookmarks = (req,res,next)=>{
  const userId = req.userId;
  User.findById(userId)
  .then(user =>{
    if(!user){
      const error = new Error('user not found!');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message : "succesfull feth !",
      bookmarks : user.bookmarks
    })
  })
  .catch(err =>{
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}


exports.likePost = (req,res,next)=>{
  const userId = req.userId;
  const postId = req.body.postId;
  var userinfo;
  var state;
  User.findById(userId)
  .then(user =>{
    if(!user){
      const error = new Error('user not found!');
      error.statusCode = 404;
      throw error;
    }
    userinfo = user;
    return Post.findById(postId)
  })
  .then(post =>{
    if(!post){
      const error = new Error('post not found!');
      error.statusCode = 404;
      throw error;
    }
    const checkuserLike = post.likes.find(user => user.userId.toString()=== userId.toString());
    if(checkuserLike){
      const newlikes = post.likes.filter(user => user.userId.toString()!== userId.toString());
      state = false;
      post.likes = newlikes;
      return post.save();
    }else{
      post.likes.push({
        userId : userId,
        username : userinfo.username
      })
      state= true;
      return post.save();
    }
  })
  .then(result =>{
    if(state){
      res.status(200).json({message :"like added successfully"});
    }else{
      res.status(200).json({message :"like deleted successfully"});
    }
  })
  .catch(err =>{
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}


exports.commentPost = (req,res,next)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const userId = req.userId;
  const postId = req.body.postId;
  const content = req.body.content;
  const time = new Date().toLocaleString() ;
  var userInfo;
  let commentImage;
  if (!req.file) {
    commentImage = "";
  }else{
    commentImage = req.file.path;
  }
  User.findById(userId)
  .then(user =>{
    if(!user){
      const error = new Error('user not found!');
      error.statusCode = 404;
      throw error;
    }
    userInfo=user;
    return Post.findById(postId);
  })
  .then(post =>{
    if(!post){
      const error = new Error('post not found!');
      error.statusCode = 404;
      throw error;
    }
    post.comments.push({
      content : content,
      time : time,
      imageUrl : commentImage,
      userId : userId,
      username : userInfo.username
    });
    post.save();
  })
  .then(result=>{
    res.status(200).json({message : "comment added successfully!"});
  })
  .catch(err =>{
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })

}
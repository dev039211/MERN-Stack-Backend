const express = require('express');
const cors=  require("cors");
//const mongoose = require('mongoose');

require('./db/config');

const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm'; //Can be kept in separate env file as constant too.

const app = express();

app.use(express.json());
app.use(cors());

app.post("/register",async(req, resp)=>{
    let user = new User(req.body);
    let result = await user.save();
    
    result = result.toObject();
    delete result.password;

    Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err,token)=>{

        if(err)
        {
            resp.send({result:"something went wrong"});
        }
        resp.send({result, auth:token});
    })
    //resp.send(result);
    //resp.send(req.body)
})

app.post("/login",async (req, resp)=>{
   // console.log(req.body);
    if(req.body.password && req.body.email){
        let user = await User.findOne(req.body).select("-password");
      
        if(user)
        {
            Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err,token)=>{

                if(err)
                {
                    resp.send({result:"something went wrong"});
                }
                resp.send({user, auth:token});
            })
           // resp.send(user);
        }
        else
            resp.send({result:'No user found!'}); 
    }
    else
    {
        resp.send({result:'No user found!'});
    }
})

app.post("/add-product",verifyToken,async(req, resp)=>{
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
})

app.get("/products",verifyToken,async(req,resp)=>{
    let products = await Product.find();
    if(products.length>0){
        resp.send(products);
    }else{
        resp.send({result:"No products found"});
    }
})

app.delete("/product/:id",verifyToken,async(req, resp)=>{
   
    const result = await Product.deleteOne({_id:req.params.id});
    resp.send(result);
});

//Update
app.get("/product/:id",verifyToken,async(req, resp)=>{
let result = await Product.findOne({_id: req.params.id});
console.log(typeof(result));
    if(result){
        resp.send(result)
    }
    else{
        resp.send({result:"No records found"})
    }
});

app.put("/product/:id",verifyToken, async(req,resp)=>{
    let result = await Product.updateOne(
        {   _id: req.params.id   },
        {
            $set:req.body
        }
    )
    resp.send(result);
});

//await => Model returns promise
//app.get("/search/:key",async(req,resp)=>{
app.get("/search/:key", verifyToken, async(req,resp)=>{
    let result = await Product.find(
    {
        "$or":[
            { name: {$regex:req.params.key} },
            { company: {$regex:req.params.key} },
            { category: {$regex:req.params.key} }
        ]
    });
    resp.send(result);
});

//Middleware for token
function verifyToken(req, resp, next){
    //Postman => headers => bearer token.
    let token = req.headers['authorization'];
   // console.warn("middleware called", token);
    if(token){
        token = token.split(' ')[1];
       // console.warn("middleware called updated", token);
        Jwt.verify(token, jwtKey, (err, valid) => {
            if(err){
                resp.status(401).send({result:"Please provide valid token"});
            }
            else{
                next();
            }
        })
    }
    else{
        resp.status(403).send({result:"Please add token with header"});
    }
   //console.warn("middleware called end", token);
    //without next will be in hang state on API call
   //next();
}

app.listen(5000)

app.get('/productall',async(req,resp)=>{
    let p = await Product.find();
   //Object type p.
    return resp.send(p);
});
/*
app.get("/products",verifyToken,async(req,resp)=>{
    let products = await Product.find();
    if(products.length>0){
        resp.send(products);
    }else{
        resp.send({result:"No products found"});
    }
})
const connectDB= async()=>{
    mongoose.connect('mongodb://localhost:27017/e-comm');
    const productSchema = new mongoose.Schema({})
    const products = mongoose.model('products',productSchema);
    const data = await products.find();
    console.warn(data);
}*/

//connectDB();
/*
app.get("/",(req, resp)=>{
    resp.send("app is working....")
});*/

//app.listen(5000)
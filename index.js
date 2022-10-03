const express = require("express")
const cors = require("cors")
const app = express();
require("dotenv").config();
const db = require("./connection")
const myfuncs = require("./myfunctions")
const collections = require("./models")
const session = require("express-session")
const detect = require('detect-port');
const joi = require ("joi")
const multer = require('multer')
const cookieparse = require("cookie-parser")
const bcrypt = require("bcrypt");
const AWS = require("aws-sdk")
const moment = require('moment');
const fs =require('fs');
const jwt = require("jsonwebtoken");
var textract = require('textract');
var axios = require('axios');
const res = require("express/lib/response"); 
var ip = require("ip");
const { isFuture } = require("date-fns");
var useragent = require('express-useragent');
const e = require("express");
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())
var bodyParser = require('body-parser')
var Sentiment=require("sentiment");
var nlp=require("wink-nlp-utils")

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const User= collections.User
const comments= collections.comments
const target= collections.target
const branch= collections.branchs
const status= collections.cstatus
const client= collections.client
const jobs= collections.jobs
const mstatus= collections.mstatus
const files =collections.files
const myroles =collections.roles
const docx = collections.docx

const access = collections.access
const userlogs = collections.userlogs
const teams = collections.teams
const profile = collections.profile
const userview = collections.userview
const userpath = collections.userpath
const breaks = collections.breaks
const mytime = collections.mytime
const elogs = collections.elogs
const logs= collections.logs
const indexes = collections.indexes
const myyears = collections.myyears

app.use(useragent.express());
const store= new session.MemoryStore();
app.use(session(
    {   
        cookie :{maxAge : 4000000}, 
        resave:false,
        saveUninitialized:false,
        secret:"secret",
        store
    }
));






const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "fileuploads");
    },
    filename: (req, file, cb) => {
        console.log(file);
        console.log(file.fieldname);
      const ext = file.mimetype.split("/")[1];
      cb(null, `${file.originalname}`);
    },
  });
  const multerFilter = (req, file, cb) => {
      cb(null, true);
    }
  const upload = multer({
    storage: multerStorage
  });


function generateAccessToken(user) {
    return jwt.sign({ user }, process.env.JSSW, { expiresIn: "87000s"});
  }
db();


app.post("/year",(req,res)=>{
myyears.find({},(err,data)=>{
res.send({status:1,data:data})
})

})
app.post("/getindustry",(req,res)=>{
console.log(req.body)
indexes.find({},'industry',(err,data)=>{
if(!err){
if(data){
res.send({data:data,status:1})

}
else{
res.send({data:[],status:1})
}
}
else{
res.send({status:0,message:err})
}
})
})
app.post("/nameslice",(req,res)=>{
console.log(req.body)
const g_string=req.body.filename

const name1=g_string.replace("Naukri","");
var name=nlp.string.extractPersonsName(name1);
console.log(name);
var sentiment=new Sentiment();
var result=sentiment.analyze(name);
console.log(result.tokens)
var name=result.tokens.slice(0,1).join(" ");
res.send({name:name,status:1})
})
app.post("/fileindexing",(req,res)=>{
    console.log(req.body);
    const u_s=new user({
        filename:req.body.filename,
        view:req.body.view,
        designation:req.body.designation,
        role:req.body.role.split(","),
        primaryskills:req.body.primaryskills.split(","),
        secondaryskills:req.body.secondaryskills.split(",")
    })
    u_s.save((err)=>{
        if(!err){
            res.send({message:"sucessfull",status:1});
        }else{
            res.send({message:"unsucessfull",status:0});
            console.log(err)
        }
    })
})


app.post("/addcount",verifytoken,(req,res)=>{
console.log(req.body)
if(req.user!=0){
profile.findOneAndUpdate({_id:req.body.eid},{$inc:{viewed:1}},async(err,data)=>{
if(!err){
var userdat=await userview.findOne({fileid:req.body.eid,userid:req.user.user._id})
if(userdat){
userdat.viewed+=1
userdat.save();
res.send({status:1,message:"done"})
}
else{
var userdat=new userview({
userid:req.user.user._id,
fileid:req.body.eid,
viewed:1,
branchid:req.user.user.branchid
})
console.log(userdat)
userdat.save(err=>{
if(!err){
res.send({message:"saved",status:1})
}
else{
res.send({status:0,message:err})
}
})
}
}
else{
res.send({message:err,status:0})
}
})
}
else{
res.send({status:0,message:"invalid or expired token"})
}
})
app.post("/me",verifytoken,(req,res)=>{
console.log(req.body)
if(req.user!=0){
userview.find({fileid:req.body.eid,userid:req.user.user._id},(err,data)=>{
if(!err){
res.send({data:data,status:1})
}
else{
res.send({message:err,status:0})
}
})
}
})
app.post("/others",verifytoken,(req,res)=>{
console.log(req.body)
if(req.user!=0){
userview.find({fileid:req.body.eid,userid:{$ne:req.user.user._id},branchid:req.user.user.branchid},(err,data)=>{
if(!err){
res.send({data:data,status:1})
}
else{
res.send({message:err,status:0})
}
})
}
})
app.post("/savefile",verifytoken,(req,res)=>{
console.log(req.body)
if(req.user!=0){
profile.find({filename:req.body.filename,industry:req.body.industry},(err,data)=>{
if(!err){
res.send({data:data,status:1,message:"profile already exist"})
}
else{
myprof = new profile({
filename:req.body.filename,
industry:req.body.industry,
designation:req.body.designation,
role:req.body.role,
primary_skills:req.body.primary_skills,
secondary_skills:req.body.secondary_skills
})

myprof.save(err=>{
if(!err){
res.send({message:"saved",status:1})
}
else{
res.send({message:err,status:0})
}
})
}
})
}
})
app.post("/getindex",(req,res)=>{
console.log(req.body)
if(req.body.industry!=""){
indexes.findOne({industry:req.body.industry},(err,data)=>{
if(!err){
if(data){
data.designation=data.designation[0].split(",")
data.role=data.role[0].split(",")
data.secondary_skills=data.secondary_skills[0].split(",")
data.primary_skills=data.primary_skills[0].split(",")
res.send({data:data,status:1})


}
else{
res.send({data:[],status:1})
}
}
else{
res.send({status:0,message:err})
}
})
}
else{
res.send({data:[],status:1})
}
})
app.post("/searchprofile",(req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    const year = mydatee.getFullYear()
    const month = localm+1
    const fmonth = "0"+month
    console.log(req.body)
  

      if(req.body.role&&req.body.role!=''){
      
      querry={role:{'$regex' : req.body.role.trim(), '$options' : 'i'}}
      }
      else{
      querry={}
      }
      if(req.body.primary&&req.body.primary!=''){
      var check = req.body.primary.split(',')
      if(check.length>1){
      primary=req.body.primary.replace(/\s+/g, "");
      primary=primary.replace(",", "|");
      }
      else{
      primary=req.body.primary.trim()
      }
     
      querry1={primary_skills:{$regex:primary, '$options' : 'i'}}
      }
      else{
      querry1={}
      }
      if(req.body.secondary&&req.body.secondary!=''){
       var check = req.body.secondary.split(',')
      if(check.length>1){
      secondary=req.body.secondary.replace(/\s+/g, "");
      secondary=secondary.replace(",", "|");
     }
     else{
     secondary=req.body.secondary.trim()
     }
      querry2={secondary_skills:{$regex:secondary, '$options' : 'i'}}
      }
      else{
      querry2={}
      }
       if(req.body.designation&&req.body.designation!=''){
      querry3={designation:{'$regex' :req.body.designation.trim(), '$options' : 'i'}}
      }
      else{
      querry3={}
      }
      console.log(querry)
      console.log(querry1)
       console.log(querry2)
        console.log(querry3)
         
      //$and:[{industry:req.body.industry},querry,querry1,querry2,querry3]
      profile.find({$and:[{industry:req.body.industry},querry,querry1,querry2,querry3]},(err,data)=>{
      if(!err){
      if(data){
      if(data.length>100){
        num=Math.round(data.length/100)
      }
      else{
        num=1
      }
      console.log(data.length)
      if(req.body.page==1){
      if(req.body.num==num){
      startnum=100*(req.body.num-1)
       end=data.length
       thisdata=data.slice(startnum,end)
       res.send({data:thisdata,num:req.body.num,total:thisdata.length})
      }else{
        startnum=100*(req.body.num-1)
       end=100*req.body.num
       thisdata=data.slice(startnum,end)
       res.send({data:thisdata,current:req.body.num,total:thisdata.length})
       }
  }
  else if(req.body.prev==1){
  
  }
  else{
      
      mdatas=data.slice(0,100)
        res.send({message:"works",status:1,data:mdatas,num:num,total:data.length,current:1})
  }
      }
      else{
      res.send({message:"no data found",status:1})
      }
      }
      else{
      console.log(err)
      }
    
      })
    
    })
  


app.post("/gettememb", verifytoken,async(req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    var year = mydatee.getFullYear() 
    const month = localm+1
    var fmonth = "0"+month
    var maxrole=await myroles.findOne({branchid:req.user.user.branchid}).sort({role:-1}).limit(1)
    console.log(maxrole)
        if(req.user!=0){
    console.log("getmemb")
    console.log(req.body)
    if(req.user.user.roleid=="1"&&(req.body.userid==''||!req.body.userid)){
        myuser=await User.findOne({_id:req.user.user._id})
        User.find({branchid:myuser.branchid,roleid:{$gte:myuser.roleid}},(err,data)=>{
            if(data){ 
                if(req.body.month&&req.body.month!=""){
                    fmonth=req.body.month
                    }
                    if(req.body.year&&req.body.year!=""){
                    year=req.body.year
                    }
                    res.send({data:data,status:1,message:"done#0"})}
               
                else{ res.send({data:[],status:0,message:"done#1"})}
            
        })
    }else{
            if((!req.body.userid||req.body.userid=='')&&req.user.user.roleid!="1"){
                console.log(req.user.user)
                myuser=await User.findOne({_id:req.user.user._id})
                if(myuser.roleid==maxrole.role){
                data=[]
                data[0]=myuser
                res.send({data:data,status:1,message:"done#2.0"})
                }else{
                User.find({teamid:myuser.teamid,roleid:{$gte:myuser.roleid}},(err,data)=>{
                    if(data){ 
                        if(req.body.month&&req.body.month!=""){
                        fmonth=req.body.month
                        }
                        if(req.body.year&&req.body.year!=""){
                        year=req.body.year
                        }
                        res.send({data:data,status:1,message:"done#2.1"})
                }
                    else{ res.send({data:[],status:0})}
                })
                }
            }
            else if(req.body.userid&&req.body.userid!=""){
            myusers=await User.findOne({_id:req.body.userid})
            console.log(myusers)
            console.log(maxrole.role)
            if(myusers.roleid==maxrole.role){
            var data=[]
            data[0]=myusers
            res.send({data:data,status:1,message:"done#3"})
            }
            else if(myusers.roleid=="1"){
             User.find({branchid:myusers.branchid,roleid:{$gte:myuser.roleid}},(err,data)=>{
             if(!err){
             if(data){
             res.send({data:data,status:1})
             }
             }
             })
            }
            else{
             User.find({teamid:myusers.teamid,roleid:{$gte:myusers.roleid}},(err,data)=>{
             if(!err){
             if(data){
             res.send({data:data,status:1,message:"done#4"})
             }
             }
             })
            }
         
            }
           
            else{
                console.log(req.body)
                myuser=await User.findOne({_id:req.body.userid})
                console.log(myuser)
                console.log(myuser.teamid)
                if(myuser.roleid==maxrole.role){
                res.send({data:myuser,status:1})
                }
                else{
                User.find({teamid:myuser.teamid,roleid:{$gte:myuser.roleid}},(err,data)=>{
                    if(data){ 
                        
                        res.send({data:data,status:1,message:"done#5"})}
                   
                    else{ res.send({data:[],status:0,message:"done#6"})}
                })
                }
        
            }
        
        }
    }
        else{
            res.send({status:2,message:"expired or invalid token"})
        }
      
    
    })



app.post("/otplogin", (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
tdt={
today:today,
todaydate:todaydate,
mydatee:mydatee,
localm:localm,
year:year,
month:month,
fmonth:fmonth
}
    console.log(req.body);
            if (req.body.otp){
                const {username, password} = req.body 
                User.findOne({username:username},  async (err, user) => {
                    if(user){
                    checkif(user._id,tdt)
                        if(user.otp==req.body.otp){
                        if(user.activity==1){
                        const therole= await myroles.findOne({_id:user.role});
                            user.login_status="1"
                            user.login_time=today
                            user.save();
                            const token = generateAccessToken(user)
                            const rtoken = generateAccessToken(therole)
                             savelogs(req.body,user,tdt)
                            
                             return res.send({message: "Login Successfull", token:"Bearer"+" "+token,status:1,role:therole}) 
                            
                            
                           
                            }
                                 else{
                        res.send({message:"your access was revoked please contact your administrator",status:0})
                        }    
                        
                            }
                        
                        
                        else{
                            res.send({message:"Otp mismatch",status:0})
                        }
                    }
                    else{
                        res.send({message:"Incorrect username",status:0})
                    }
                })
            }
            else{
                User.findOne({username:req.body.username}, async(err, user) => {
                   console.log(req.body)
                    if(user){
                    var OTP= Math.floor(100000 + Math.random() * 900000)
                    user.otp=OTP
                    user.save();
                     res.send({status:1,message:"userfound",otp:OTP})
                    }
                    else{
                        res.send({status:0,message:"user not found please register"})
                    }
                })

            }
                 })

             
       app.post("/myupload",verifytoken,async (req, res) => {
       let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
  console.log(req.body)
  console.log("myupload")
    if(req.user!=0){

                                 const addstatus = new files({
              file:req.body.filename,
              recruid:req.body.recruid,
              name:req.body.name,
              cname:req.body.cname,
              mobile:req.body.mobile
          })
          addstatus.save(err=>{
          console.log("done")
          res.send({status:1,message:"done"})
          });
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }

  });

                      
                    

app.post("/invoice", verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
if(req.user!=0){
if(req.body.invoice==1){
if(req.body.name&&req.body.name!=''){
querry={cname:req.body.name}
}
else{
querry={}
}
if(req.body.month&&req.body.month!=''&&req.body.year&&req.body.year!=''){
querry1={date:{$regex:"-"+req.body.month+"-"+req.body.year}}
}
else{
querry1={}
}
comments.find({$and:[{branchid:req.user.user.branchid},{status:"Joined"},querry,querry1]},(err,data)=>{
if(!err){
if(data){
res.send({data:data,status:1})
}
}
})
}

else{
comments.find({branchid:req.user.user.branchid,status:"Joined"},(err,data)=>{
if(!err){
if(data){
res.send({message:"done",status:1,data:data})
}
else{
res.send({message:"not found",status:0})
}
}
else{res.send({message:err,status:0})
}
})
}
}
else{
res.send({status:2,message:"expired oe invalid token"})
}
})                  
                    
app.post("/retrole", verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
if(req.user!=0){
  
  myroles.findOne({_id:req.user.user.role},(err,data)=>{
       if(!err){
       if(data){
       res.send({status:1,data:data})
       }
       else{
       res.send({status:0})
       }
       }
  })

}
else{
res.send({status:2,message:"expired oe invalid token"})
}
})



app.post("/retstatus", verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log("retstatus");
console.log(req.body)
if(req.user!=0){
if(req.body.rs==1){
if(req.body.num==8){
comments.find({num:{$gte:req.body.num},revenue:{$ne:0},branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{

  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if(req.body.num==9){
comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{

  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if(req.body.num==12){

comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if(req.body.num==13){

comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if(req.body.num==4){

comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if(req.body.num==2){

comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if(req.body.num==10||req.body.num==11){

comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }})
}
else if (req.body.num==15){

comments.find({num:{$gte:8},branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
  console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
}
else if (req.body.num==16){

comments.find({num:9,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
  console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
}
else if (req.body.num==17){

comments.find({num:13,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
  console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
}
else if (req.body.num==18){

comments.find({num:12,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
  console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
}
else{

comments.find({num:{$gte:req.body.num},branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
  console.log("#here")
  console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
}

}
else{
if(req.body.num==10||req.body.num==11){

  comments.find({num:req.body.num,branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{
  if(!err){
  if(data){
           console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
}
else{
  comments.find({num:{$gte:req.body.num},branchid:req.user.user.branchid,userid:req.body.userid,date:req.body.date,iterested:"Interested"},(err,data)=>{

  if(!err){
  if(data){
  console.log(data)
  res.send({status:1,message:"data found",data:data})
  }
  else{
  res.send({status:1,message:"no data found",data:[]})
  }
  }
  else{
  console.log(err)
  }
  
  })
  }
  }
}
else{
res.send({status:2,message:"expired oe invalid token"})
}
})

app.post("/login", async (req, res)=> {

var indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});

const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
console.log(todaydate)
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
yearlookup(year)
const month = localm+1
const fmonth = "0"+month

tdt={
today:today,
todaydate:todaydate,
mydatee:mydatee,
localm:localm,
year:year,
month:month,
fmonth:fmonth
}
var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 

var ipaddress = ip.split(':')

ip=ipaddress[3]

  devicedata=req.useragent
                    req.body.devicetype="OS:"+devicedata.os+"/"+"Desktop:"+devicedata.isDesktop+"/"+"Mobile:"+devicedata.isMobile+"/"+"Tablet:"+devicedata.isTablet+"/"+"Ipad:"+devicedata.isiPad+"/"+"Browser:"+devicedata.browser+"."
        console.log(req.body);
        const {username, password} = req.body 
        if(username!=''&&password!=''){
        User.findOne({username:username}, async (err, user) => {
            if(user){
            const getpass = await bcrypt.compare(
                req.body.password,
                user.password
            );
                if(getpass) {
                var timedata= await checktime(user)
                console.log(timedata);
                if(user.activity==1&&timedata==1){
                checkif(user._id,tdt)
                const therole= await myroles.findOne({_id:user.role});
                    user.login_status="1"
                    user.login_time=today 
                    user.ipaddress=ip
                    user.devicetype=req.body.devicetype
                    user.save();
                    user.login=1
                    console.log("done");
                    let jwtSecretKey = process.env.JSSW;
                    console.log(jwtSecretKey)
                    const token = generateAccessToken(user)
                    req.body.ipaddress=ip
                    
             console.log(req.body)
                     savelogs(req.body,user,tdt)
                     console.log("sent")
                           res.send({message: "Login Successfull", token:"Bearer"+" "+token,status:1,role:therole})              
                        }
                        else{
                            res.send({message:"your access was revoked or paused please contact your administrator",status:0})
                        }
                        }
                        else{
                        res.send({message:"password missmatch",status:0})
                        }
                    }
                    
                    else{
                       res.send({message:"user not registered",status:0})
                    }
                    }) 
                    }
                      else{
res.send({status:0,message:"Please enter username and password!!!"})
    }
            })



           app.post("/viewactivity",verifytoken,async(req, res)=> {
            console.log(req.body)
if(req.user!=0){
usertimes.find({},async(err,data)=>{
if(!err){
if(data){
data1=await User.find({})
res.send({message:"Done",status:1,data:data,data1:data1})
}
else{
res.send({message:"Done",status:1,data:[]})
}
}
else{
console.log(err)
}
})
}
})   




app.post("/logout",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
if(req.user!=0){
var fstdata = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
todaydata =moment(fstdata).format("DD-MM-YYYY HH:mm:ss")
    User.findOne({_id:req.user.user._id}, async(err, user) => {
    if(user){
    var data5= await userlogs.findOne({userid:req.user.user._id,date:todaydate}).sort({numtime:-1}).limit(1)
                data5.logouttime=todaydata
                user.login_status="0"
                user.logout_time=todaydata
                user.save();
                data5.save();
                res.send({message: "Logout  Successfull", user: user})
                
               
                }
    })
    }
    else{
    res.send({message: "You are not logged in unable to logout"})
    }
    
  
})

app.post("/createbranches", verifytoken,async(req,res)=>{
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body+"increateS");
    console.log(req.body)
    if(req.user!=0){
        const udata = await User.findOne({username:req.body.username})
        myroles.findOne({rolename:"SuperAdmin"},(err,newdata)=>{
            console.log(newdata);
            if(newdata.id ==req.user.user.role){
                const vari=req.body
                branch.findOne({username:vari.username},async (err,data)=>{
                    const salt = await bcrypt.genSalt(Number(process.env.SALT));
                    const hash = await bcrypt.hash(vari.password, salt);
                if (data || udata){
                    res.send({message:"Branch already exist under username "+vari.username,user:data,status:0})
                }
                else{
                    const collections =new branch({ username:vari.username,password:hash , cname:vari.cname , mobile:vari.mobile,search:vari.search})
                     
                collections.save ( async(err) =>
                    {if(err){
                        res.send({message:"and error occured while saving data",status:0})
                    }
                    else{
                    const newrole = new myroles({rolename:"Head",cj:1,vj:1,AA:1,branchid:collections.id,role:1})
                    newrole.save( async(err) =>{
                        if(err){
                            res.send({message:"and error occured while saving data",status:0})
                        }
                        else{
                            const users = new User({ name:req.body.cname,username:vari.username,roleid:newrole.role,password:hash,leader:req.user.user._id,role:newrole._id,rolename:newrole.rolename,activity:1,leadername:req.user.user.name,login_status:"",login_time:"",logout_time:"",branchid:collections.id})
                            users.save( async(err) =>{
                                if(err){
                                    res.send({message:"and error occured while saving data",status:0})
                                }
                            })
                        }
                    }
                        )
                        const val=await accesscreate(collections)
                        if(val==1){
                        console.log(val)
                        res.send({message:"saved successfully",user:collections,status:1,token:req.body.token})
                        }
                        else{
                        console.log('error')
                        }
                    }
                
                    })
                }
                
                
                })
            }
            else{
                res.send({message:"page unavailable to user",status:0})
            }
        })
       
    }
   else{
    res.send({message:"Token expired or invalid",status:2})
   }  
   
})

app.post("/jobinfo",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
if(req.user!=0){
jobs.findOne({jobid:req.body.eid,branchid:req.user.user.branchid},(err,data)=>{
if(!err){
if(data){
res.send({message:"done",status:1,data:data})
}
else{
res.send({message:"notfound",status:0})
}
}
else{res.send({message:err,status:0})
}

})
}
else{
res.send({message:"Invalid or expired token",status:2})
}
})
app.post("/viewaccess",verifytoken,(req, res)=> {
if(req.user!=0){
access.find({branchid:req.user.user.branchid},(err,data)=>{
if(!err){
if(data){
res.send({message:"done",status:1,data:data})
}
else{
res.send({message:"notfound",status:0})
}
}
else{res.send({message:err,status:0})
}

})
}
else{
res.send({message:"Invalid or expired token",status:2})
}
})

app.post("/editaccess",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
if(req.user!=0){
access.findOneAndUpdate({_id:req.body.eid,branchid:req.user.user.branchid},req.body,(err,data)=>{
if(!err){
if(data){
res.send({message:"done",status:1,data:data})
}
else{
res.send({message:"notfound",status:0})
}
}
else{res.send({message:err,status:0})
}

})
}
else{
res.send({message:"Invalid or expired token",status:2})
}
})

app.post("/mycandidates",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
    if(req.user!=0){
    if(req.body.user&&(req.body.user!=''||req.body.user!='0')){
    userid=req.body.user
    }
    else if(req.body.user==''||req.body.user=='0'){
     userid=req.user.user._id
    }
    else{
    userid=req.user.user._id
    }
    tmonth=req.body.month
    tyear=req.body.year
    if((tmonth!='0'||tmonth!='')){
    
    tm=tmonth
    }
    else{
    tm="0"+month
    }
    if(tyear=='0'||tyear==''){
    ty=year
    }
    else{
    ty=tyear
    }
    if((userid!=''||(tmonth!='0'&&tmonth!='')||(tyear!='0'&&tyear!=''))&&(req.body.token&&req.body.candidate=='1')){
    if(userid!=''&&tmonth!='0'&&tyear!='0')
    {
        querry={$and:[{userid:userid},{date:{$regex:"-"+tmonth+"-"+tyear,$options:'i'}}]}
    }
    else if (userid!=''||userid=='0'){
    
    querry={$and:[{userid:userid},{date:{$regex:"-"+tm+"-"+ty,$options:'i'}}]}
    }
    else if((tyear!='0'&&tyear!='')||(tmonth!='0'&&tmonth!='')){
    
    querry={$and:[{userid:userid},{date:{$regex:"-"+tm+"-"+ty,$options: 'i'}}]}
    }
    console.log(ty)
    console.log(tm)
    comments.find({$and:[querry,{branchid:req.user.user.branchid}]},(err,data)=>{
        if(!err){
           if(data){
           console.log(data)
            res.send({message:"found",data:data,status:1,user:userid,year:ty,month:tm})
           }
           else{
            res.send({message:"empty data",status:1,user:userid,year:ty,month:tm})
           }
        }
    else{
        res.send({message:err,status:0})
    }
    })
    }
    else{
        tm="0"+month
        comments.find({userid:req.user.user._id,date:{$regex:"-"+tm+"-"+year,$options:'i'}},(err,usr)=>{
            if(err){
            console.log(err)
            res.send({message:err})
            }
            else{
            if(usr){
            
                  res.send({message:"found",status:1,data:usr,user:req.user.user._id,year:year,month:tm})
            }
            else{
                res.send({message:"not found",status:0})
            }
            }
    
    })
    }
        
    }
    else{
    res.send({message:"Invalid or expired token",status:2})
    }
    })
    app.post("/viewbranch",verifytoken,async(req,res)=>{
    console.log(req.body);
    if(req.user!=0){
    const role =await myroles.findOne({_id:req.user.user.role});
        if(role.role=="99"){
    branch.find({},(err,data)=>{
    if(!err){
    if(data){
    console.log(data)
    res.send({data:data,status:1,token:req.body.token})
    }
    else{
    res.send({message:"no data found",status:0})
    }
    }
    else{
    res.send({message:err,status:0})
    }
    })
    }
    else{
        res.send({message:"you dont have access to this",status:0})
    }
    }
    //
    else{
    res.send({status:2,message:"invalid token or expired"})
    }
    })
app.put("/editbranches",verifytoken,async(req,res)=>{
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
    if(req.user!=0){
        const role =await myroles.findOne({_id:req.user.user.role});
        if(role.AA==1){
            if(req.body.eid){
            if (req.body.search=={}){
            req.body.search=''
            }
                branch.findOneAndUpdate({_id:req.body.eid},req.body,async(err,data)=>{
                if(!err){
                var userdat=await User.findOne({branchid:req.body.eid,roleid:"1"})
                if(userdat){
                if(req.body.username!=''){
                userdat.username=req.body.username
                }
                if(req.body.cname!=''){
                userdat.name=req.body.cname
                }
                userdat.save(err=>{ res.send({message:"done",status:1})})
                }
              
               
            }
            else{
            console.log(err)
                res.send({message:"error occured try again",status:0})
            }
                
                })
                }
                else{
                console.log("done")
                res.send({message:"unable to find '_id' for change",status:0})
                }
        }
        else{
            res.send({message:"cant access this page",status:0})
        }
    }
   else{
    res.send({message:"invalid token or expired",status:2})
   }

})

app.post("/uploadfile",verifytoken,(req, res) => {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
        console.log(req.file.filename);
        const addstatus = new files({
            file:req.body.filename,
            recruid:req.body.recruid,
            name:req.body.name,
            cname:req.body.cname,
            mobile:req.body.mobile,
            date:today
        })
        addstatus.save(err=>{
            if(!err){
                res.send({message:"done",status:1})
            }
            else{
                res.send({message:"error occured try again",status:0})
            }
            
        })
       
    }
 else{
    res.send({message:"Invalid or expired token",status:2})
 }
  });


                    
app.post("/addrole",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
        myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid},(err,data1)=>{
            if(data1){
                if(data1.AA==1){
                    myroles.findOne({rolename:req.body.rolename,branchid:req.user.user.branchid},(err,data)=>{
                        if(!err){
                            if(data){
                                res.send({message:"data already exist",status:0})
                            }
                        else{
                        console.log("done1");
                       
                            const addroles = new myroles({
                                   rolename:req.body.rolename,
                                   role:req.body.role,
                                   cj:req.body.cj,
                                   vj:req.body.vj,
                                   AA:0,
                                   branchid:req.user.user.branchid
                            })
                            addroles.save( err=>{
                                if(err){
                                    res.send({message:"error occuer while saving",status:0})
                
                                }
                                else{
                                console.log("done2")
                                    res.send({message:"saved your data",status:1,token:req.body.token})
                                }
                            })
                        }
                        }
                        else{
                            res.send({message:"an error occured",status:0})
                        }
                
                    })
                    }
                    else{
                        res.send({message:"Not admin!! please login as admin",status:0})
                    } 
    
            }
            else{
            console.log("notfound")
                res.send({message:"headlogin not found",status:0})
            }
           
        })
        
    }
    else{
        res.send({message:"invalid token or expired",status:2})
    }
    
  })
app.put("/editrole",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month

    if(req.user!=0){
        myroles.findOne({_id:req.user.user.role},(err,role)=>{
            if(role.AA==1){
                myroles.findOneAndUpdate({_id:req.body.eid},req.body,(err,data)=>{
                    if(!err){
                        if(data){
                            console.log(data)
                      res.send({message:data+"successfully updated",status:1,token:req.body.token})  
                      }
                  else{
                      res.send({message:"data not found",status:0})
                  }  
              
              }    
              else{
                  res.send({message:"data not found",status:0})
              }
              })
            }
            else{
                res.send({message:"access denied",status:0})
            }
        })
    }
    else{
        res.send({message:"token expired or invalid",status:2})
    }
    })

    
 app.post("/getrole",verifytoken,(req, res)=> {
 let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
        myroles.findOne({_id:req.user.user.role},(err,role)=>{
            if(role.AA==1){
                myroles.find({branchid:req.user.user.branchid},(err,data)=>{
                    if(!err){
                        if(data){
                      res.send({data:data,status:1,token:req.body.token})  
                      }
                  else{
                      res.send({message:"data not found",status:0})
                  }  
              
              }    
              else{
                  res.send({message:"data not found",status:0})
              }
              })
            }
        else{
            res.send({message:"access denied",status:0})
        }
        })
       
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
  
  



app.post ("/adduser", verifytoken ,async(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month

    if(req.user!=0){
        const thisrole= await myroles.findOne({_id:req.user.user.role})
        if (thisrole.AA==1){
            const num = await validateInput(req.body)
            if (!num.error){
            const login_status = "0"
            const login_time = " "
            const logout_time = " "
            const { name, username,password,leader,role} = req.body
             const therole =await myroles.findOne({_id:req.body.role})
            
                User.findOne({username: username}, async (err, user) => {
                    console.log("in1")
                    if(user){
                        res.send({message: "User already registerd",status:0}) 
                    } else if (therole){
                        console.log("in2")
                 const myleader= await User.findOne({_id:leader});  
                 const salt = await bcrypt.genSalt(Number(process.env.SALT));
                 const hash = await bcrypt.hash(req.body.password, salt);
                 console.log(myleader)
                 if(therole.role==2){
                                       var thisdata= new teams({
                                        name:req.body.name
                                       })
                                       thisdata.save();
                                       
                                        const user = new User({
                                            name,
                                            username,password:
                                            hash,leader:myleader._id,rolename:therole.rolename,role:therole.id,roleid:therole.role,activity:1,leadername:myleader.name,login_status,login_time,logout_time,created:todaydate,modified:todaydate,branchid:req.user.user.branchid,teamid:thisdata._id
                                        })      
                                        user.save(async(err) => {
                                            if(err) {
                                            console.log(err)
                                                res.send(err)
                                            } else {
                                            
                                                res.send( { message: "Successfully Registered, Please login now.",status:1,token:req.body.token})
                                            }
                                        })
                                      
                                }
                                else{
                                    const user = new User({
                                        name,
                                        username,password:
                                        hash,leader:myleader._id,rolename:therole.rolename,role:therole.id,roleid:therole.role,activity:1,leadername:myleader.name,login_status,login_time,logout_time,created:todaydate,modified:todaydate,branchid:req.user.user.branchid,teamid:myleader.teamid
                                    })      
                                    user.save(async(err) => {
                                        if(err) {
                                        console.log(err)
                                            res.send(err)
                                        } else {
                                      
                                            res.send( { message: "Successfully Registered, Please login now.",status:1,token:req.body.token})
                                        }
                                    })
                                }
                      
                    }
                    else{
                        console.log("norole")
                        res.send({message:"no role exist",status:0})
                    }
                })   
            }
            else{
                
                res.send({message:"Enter a valid form",status:0})
            }  
        }
        else{
        res.send({message:"not a head",status:0})
        }
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
}) 

app.post("/viewuser", verifytoken,async(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
        const thisrole= await myroles.findOne({_id:req.user.user.role})
        if (thisrole.AA==1){
    if (req.body.username){
     User.findOne(req.body, async(err, user) => {
        if(user){
        const thisdata = await User.find({branchid:req.user.user.branchid});
        thisdata.forEach(element=>{
          myroles.findOne({_id:element.role},(err,data)=>{
             element.roleinfo={
                        roleid:data.role,
                        rolename:data.rolename
             }
          })
        
        })
            res.send({message:"Userfound",user:thisdata,status:1,token:req.body.token})
        }
        else{  
            res.send({message:"not found",user:username,status:0})  
        } 

})
} 
else{
User.find ({branchid:req.user.user.branchid}, (err, user) => {
                
                
                    res.send({message:"All users",user:user,status:1,token:req.body.token})
                
            })
                
}

        }
        else{
            res.send({message:"access denied",status:0})
        }
    }
       else{
        res.send({message:"invalid or expired token",status:2})
       }
    
})
        
app.put("/edituser", verifytoken,async(req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    const year = mydatee.getFullYear() 
    const month = localm+1
    const fmonth = "0"+month
    console.log(req.body)
    console.log("here")
        if(req.user!=0){
        if(req.body.get==1){
        User.findOne({_id:req.body.eid},(err,data)=>{
        if(!err){
        if(data){
        res.send({data:data,status:1})
        }
        else{
        res.send({status:0})
        }
        }
        else{
        res.send({message:err,status:1})
        }
        })
        }
        else{
        if(req.body.eid){
           
        
         const thisrole= await myroles.findOne({_id:req.user.user.role})
            if (thisrole.AA==1){
            if (req.body.username){
            const leardername= await User.findOne({_id:req.body.leader})
            req.body.leadername=leardername.name
            const rolename= await myroles.findOne({_id:req.body.role})
            req.body.rolename=rolename.rolename
                User.findOneAndUpdate({_id:req.body.eid},req.body,async(err, user) => {
                   if(user){
                      if(req.user.user.roleid=="1"){
                      branch.findOneAndUpdate({_id:user.branchid},{username:req.body.username},async(err,data)=>{
                       
                       user.modified=todaydate
                       user.save(err=>{
                       if(!err){
                       res.send({message:"User updated successfully",user:user,status:1,token:req.body.token})
                       }
                       });
                      }) 
                   }
                   else{  
                      
                               res.send({message:"Notfound",user:user,status:0})
                           
                   } 
                }
           }) 
           }
           else {
           
               res.send({message:"Empty data",user:"Not found",status:0})
           }
        }
    
        else{
            res.send({message:"Access denied",status:0})
        }
    }
    }
    }
        else{
            res.send({message:"Invalid or expired token",status:2})
        }
    })
    
    

app.post("/addclient",verifytoken,async (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    console.log(req.body)
    if(req.user!=0){
        myroles.findOne({_id:req.user.user.role},(err,therole)=>{
            if(therole.AA==1){
                   
        client.findOne({cname:req.body.cname,branchid:req.user.user.branchid},async(err,data)=>{
          
            if(data){
                console.log(data)
                res.send({message:"already registered"+req.body.cname,status:0})
            }
           
            else{
           
             var name= await User.findOne({_id:req.body.manager},'name');
                const data1 =new client({
                    cname:req.body.cname,
                    manager:name,
                    country:req.body.country,
                    city:req.body.city,
                    head_name:req.body.head_name,
                    head_designation:req.body.head_designation,
                    head_mail:req.body.head_mail,
                    head_contact_no:req.body.head_contact_no,
                    recruiters:req.body.recruiters,
                    payments:req.body.payments,
                    branchid:req.user.user.branchid
                    })
                data1.save(err => {
                    if(err) {
                      
                        res.send({message:err,status:0})
                    } else {
                      
                        res.send( { message: "Successfully Added" ,status:1,token:req.body.token})
                    }
            })
            
            
            }
            })
            }
            else{
            
                res.send({message:"access denied",status:0})
            }
        })
    }
    else{
        res.send({message:"Invalid or expired token",status:2})
    }
 
})

app.post("/forgotpassword",verifytoken,async (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
if(req.user!=0){
  console.log(req.body)
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
     const hash = await bcrypt.hash(req.body.password, salt);
     console.log(hash);
     User.findOne({_id:req.user.user._id}, (err, user) => {
     if(user){
           user.password=hash
           user.save()
           console.log("done")
           res.send({message:"Updated user",user:req.body.username,status:1})
           }
           else{
            res.send({message:" User not found ",user:req.body.username,status:0})
           }
      })
      }
      else{
      res.send({message:"Invalid or expired token",status:2})
      }
})


app.put("/editclient",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
        myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid},(err,role)=>{
            if(role.AA==1){
                client.findOneAndUpdate({_id:req.body.eid},req.body,(err,data)=>{
                    if(!err){
                        jobs.updateMany({cid:req.body.eid },{compname:req.body.cname},(err,data)=>{
                        if(err){
                        console.log(err)
                        
                        }
                        else{
                        res.send({message:"data saved successfully",status:1,token:req.body.token})
                        }
                        })
                        
                    }
                    else{
                        res.send({message:"unable to save",status:0})
                    }
                
                })
            }
            else{
                res.send({message:"access denied",status:0})
            }
            
        })
    }
    else{
        res.send({message:"Invalid token or expired session",status:2})
    }


}) 
app.post("/cnames",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
        client.find({branchid:req.user.user.branchid},'cname',(err,data)=>{
            res.send({data:data,status:1})
        })
    }
    else{
        res.send({message:"Invalid or expired token",status:2})
    }
})
app.post("/recnames",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
    console.log(req.body)
        client.findOne({_id:req.body.eid},'recruiters',(err,data)=>{
            res.send({data:data,status:1})
        })
    }
    else{
        res.send({message:"Invalid or expired token",status:2})
    }
})
 
app.post("/viewclient",verifytoken,async (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    console.log(req.body)
    if(req.user!=0){
        myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid},(err,role)=>{
            if(role.AA==1){
    client.find({branchid:req.user.user.branchid},async(err,data)=>{ 
    const roles2=await User.find({roleid:"2",branchid:req.user.user.branchid});
    const cnames =await client.find({branchid:req.user.user.branchid},('cname'));
      if(!err){
          if(data){
           console.log(data)
              res.send({message:"datafound",mydata:data,cm:roles2,cnames:cnames,status:1,token:req.body.token})
          }
          else{
              res.send({message:"data not foundfor your branch",status:0})
          }
      }
      else{
          res.send({message:"unable to find please try later",status:0})
      }
  
  })
}
else{
    res.send({message:"access denied",status:0})
}
})
}
else{
    res.send({message:"Invalid token or expired session",status:2})
}
  })
app.post("/targetadd", verifytoken,async (req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    const year = mydatee.getFullYear() 
    const month = localm+1
    const fmonth = "0"+month
    console.log(req.body)
                if(req.user!=0){
                    var therole=await myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid})
                    if(therole.AA==1){
                    var user = await User.findOne({_id:req.body.name}) 
                        target.findOne({user_id:user._id,Q:req.body.Q,year:req.body.year}, (err, targ) => {
                            if(targ)
                                {
                                      res.send({message:"Data  already registered (use edit option for changes) ",status:1})
                                }
                                else{
                   
                        const targets =new target({
                            user_id:user.id,
                            name:user.name,
                            year:req.body.year,
                            Qtarget:req.body.Qtarget,
                            Q:req.body.Q,
                            m1:0,
                            m2:0,
                            m3:0,
                            m1total:0,
                            m2total:0,
                            m3total:0,
                            compleation:0,
                            perc:0,
                            branchid:user.branchid
                        })
                        targets.save (async(err) => {
                            if(err) {
                                res.send({message:err,status:0})
                            } else {
                                User.find({_id:{$ne:user._id},teamid:user.teamid,branchid:user.branchid,roleid:{$ne:"99"}},(err,data)=>{

                                    data.forEach(element=>{
                                        const targets =new target({
                                            user_id:element._id,
                                            name:element.name,
                                            year:req.body.year,
                                            Qtarget:req.body.Qtarget,
                                            Q:req.body.Q,
                                            m1:0,
                                            m2:0,
                                            m3:0,
                                            m1total:0,
                                            m2total:0,
                                            m3total:0,
                                            compleation:0,
                                            perc:0,
                                            branchid:element.branchid
                                        })
                                        targets.save();
                                    })
                                }
                                )
                                const targets =new target({
                                            user_id:req.user.user._id,
                                            name:req.user.user.name,
                                            year:req.body.year,
                                            Qtarget:req.body.Qtarget,
                                            Q:req.body.Q,
                                            m1:0,
                                            m2:0,
                                            m3:0,
                                            m1total:0,
                                            m2total:0,
                                            m3total:0,
                                            compleation:0,
                                            perc:0,
                                            branchid:req.user.user.branchid
                                        })
                                        targets.save(err=>{
                                        if(!err){
                                        res.send({status:1,message:"done"})
                                        }
                                        });
                                
                            }
               })
            }
                  })
                    }
                    
            }
              else{
              res.send({message:"Invalid or expired token ",status:2})
              }
        
                    
        })
app.put("/targetedit", verifytoken,async (req, res)=> {
  let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
  const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
  const todaydate=moment(indian_date).format("DD-MM-YYYY")
  const mydatee=new Date()
  const localm = mydatee.getMonth() 
  const year = mydatee.getFullYear() 
  const month = localm+1
  const fmonth = "0"+month
  console.log(req.body)
              if(req.user!=0){
              target.findOne({_id:req.body.eid},(err, data) => {
                         prev=data.Qtarget
                          data.save(err=>{
                         
                          if(!err){
                           q=thisfunc()
                          newtarget(data.user_id,prev,req.body,q)
                          res.send({message:"done",status:1})
                      }
                          })
                          
                          });
                          
                          
                       
                              
                         
                          
                  
                
              }
                 
              else{
                  res.send({message:"Invalid or expired token",status:2})
              }
              
  })   
app.post("/targetview",verifytoken,async (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
tyear=year
console.log(req.body)
if(req.user!=0){
const{name,Q,year}=req.body
if((name!=''||(Q!='0'&&Q!='')||(year!='0'&&year!=''))&&(req.body.token&&req.body.target=='1')){

    if(name!=''){
    temp=await User.findOne({_id:name});
    user=temp._id
    }
    else{
    user="0"
    }
    therole = await myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid});
    if(therole.AA==1){
                 if(name&&(Q!='0'&&Q!='')&&(year!='0'&&year!='')){
    querry={user_id:user,Q:req.body.Q,year:req.body.year}
    }
    else if(name){
    if((Q!='0'&&Q!='')||(year!='0'&&year!='')){
    querry={$and:[{user_id:user},{$or:[{Q:req.body.Q},{year:req.body.year}]}]}
     
    }
    else{
     querry={user_id:user.id}
     }
    }
    else if(year!='0'&&year!=''){
    if(user!="0"){
     querry={$or:[{year:req.body.year},{$or:[{Q:req.body.Q},{user_id:user.id}]}]}
     
     }
    else if (Q!='0'&&Q!=''){
    querry={$and:[{year:req.body.year},{Q:req.body.Q}]}
    }
    else{
     querry={$or:[{year:req.body.year},{Q:req.body.Q}]}
    }
    }
    else if(Q!='0'&&Q!=''){
      if(user!="0"){
      
     querry={$or:[{Q:req.body.Q},{$or:[{year:req.body.year},{user_id:user.id}]}]}
     }
    else if (year!='0'&&year!=''){
    querry={$and:[{year:req.body.year},{Q:req.body.Q}]}
    }
    else{
    querry={$or:[{year:req.body.year},{Q:req.body.Q}]}
    }
    }
    }
  
    target.find({$and:[querry,{branchid:req.user.user.branchid}]},(err,data)=>{
      if(!err){
      if(data){
        res.send({data:data,status:1,userid:user})
      }
      else{
      res.send({message:"nodata found",status:1})
      }
      }
      else{
      res.send({message:err,status:0})
      }
    })

      }
      else{
 
      q=thisfunc()
       target.find({branchid:req.user.user.branchid,year:tyear,Q:q.q},async(err, data)=>{
       if(data){
      
        res.send({message:"All datas",data:data,status:1})
       }
       else{
       console.log("no datas")
       res.send({message:" no datas found ",status:0})
       }
       })
    }
}
else{
    res.send({message:"Invalid or expired token",status:2})
}

    }) 
    
    
app.post("/myreports",verifytoken,(req,res)=>{
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
console.log("myreports")
    if(req.user!=0){
    if(((req.body.user!='')||(req.body.month!='0'&&req.body.month!='')||(req.body.year!='0'&&req.body.year!=''))&&(req.body.token&&req.body.reports=='1')){
    if(req.body.user==''){
    userid=req.user.user._id
    }
    else{
    userid=req.body.user
    }
    if(req.body.month=='0'||req.body.month==''){
    if(month>9){
    m=month
    }
    else{m="0"+month}
    
    }
    else{
    m=req.body.month
    }
    if(req.body.year=='0'||req.body.year==''){
        y=year
    }
    else{

    y=req.body.year
    }
       status.find({userid:userid,date:{$regex:"-"+m+"-"+y,$options: 'i'}},async(err,data)=>{
            if(!err){
                if(data.length>0){
                mdata= await mstatus.findOne({userid:userid,month:m});
                console.log(mdata)
                    res.send({data:data,status:1,mdata:mdata,year:y,month:m,user:userid})
                }
                else{
                    res.send({message:"nodatafound",status:0,data:[],mdata:[],year:y,month:m,user:userid})
                }
            }
            else{
                res.send({error:err})
            }
        })
    }
    else{
    if(month>9){
    m=month
    }
    else{m="0"+month}
     status.find({userid:req.user.user._id,date:{$regex:"-"+m+"-"+year,$options: 'i'}},async(err,data)=>{
            if(!err){
                if(data.length>0){
                 mdata= await mstatus.findOne({userid:req.user.user._id,month:m});
                console.log(data)
                    res.send({data:data,status:1,mdata:mdata,year:year,month:m,user:req.user.user._id})
                }
                else{
                    res.send({message:"nodatafound",status:0,data:[],mdata:[],year:year,month:m,user:req.user.user._id})
                }
            }
            else{
                res.send({error:err})
            }
        })
    }
       
    }
    else{
        res.send({message:"invalid or expired token ",status:2})
    }
  
})  
app.post("/teamreport",verifytoken,(req,res)=>{
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
console.log("myreports")
    if(req.user!=0){
    if(req.user.user.roleid=="1"){
    
    }
    }
       
    
    else{
        res.send({message:"invalid or expired token ",status:2})
    }
  
})  
  
  
  app.post("/addjob",verifytoken,async(req, res)=> {
  let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const todaydate1=moment(indian_date).format("YYYY-MM-DD")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
   
      if(req.user!=0){
   
        therole=await myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid});
    
        if(therole.cj==1){
            client.findOne({_id:req.body.cname},(err,data)=>{
                if(err){
                    res.send({message:"please try again later",status:0})
                }
              else{                                                                                                                                         
                  if(data){
                                       
                                       if(req.body.teamid=='[object Object]')
                                       {
                                        var jsdata=[]
                                       }
                                       else{
                                       var jsdata=JSON.parse(req.body.teamid);
                                       }
                                         if(req.body.othersid=='[object Object]')
                                       {
                                        var jsdata1=[]
                                       }
                                       else{
                                         var jsdata1=JSON.parse(req.body.othersid);
                                       }
                                         if(req.body.recruiter=='[object Object]')
                                       {
                                        var rec=[]
                                       }
                                       else{
                                       var rec=JSON.parse(req.body.recruiter);
                                       }
                                      
                                       
                                          const data3 =new jobs({
                                              userid:req.user.user._id,
                                              cname:req.body.cname,
                                              cid:data.id,
                                              jobloc:req.body.jobloc,
                                              jobid:Math.floor(100000 + Math.random() * 900000),
                                              recruiter_name:rec,
                                              jobtitle:req.body.jobtitle,
                                              totalexp:req.body.totalexp,
                                              releventexp:req.body.releventexp,
                                              filename:req.body.filename,
                                              teamid:jsdata,
                                              othersid:jsdata1,
                                              jobgist:req.body.jobgist,
                                              compname:data.cname,
                                              branchid:req.user.user.branchid,
                                              date:todaydate,
                                              qdate:todaydate1
                                          })
                                          data3.save(err=>{
                                          if(!err){
                                          res.send({status:1,message:"done"})
                                          }
                                          })
                                       }
                                    else{
                      res.send({message:"client not found",status:0})
                  }
                                
                                }
              })
        }
        else{console.log("access denied")
            res.send({message:"access denied",status:0})
        }
      }
      else{
        res.send({message:"Invalid or expired token",status:2})
      }
    
    
    })
 

app.put("/editjobs",verifytoken,async(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
console.log("edit jobs")
    if(req.user!=0){
    if(req.body.filename){
          jobs.findOneAndUpdate({_id:req.body.eid},req.body,(err,data)=>{
                if(!err){
                    if(data){
                    comments.update({jobid:data.jobid,branchid:req.user.user.branchid},{namejob:data.jobtitle})
                    res.send({message:"data saved successfully",status:1})
                }
                else{
                    res.send({message:"unsuccessful save",status:0})
                }
                }
                else{
                    res.send({message:"unable to save",status:0})
                }
            
            })
    }
    else{
    var jsdata=JSON.parse(req.body.data);
    if(typeof(jsdata.recruiter)=='string'){
      req.body.recruiter_name=JSON.parse(jsdata.recruiter)
    }
    else{
     req.body.recruiter_name =jsdata.recruiter
    }
    if(typeof(jsdata.team)=='string'){
      req.body.teamid=JSON.parse(jsdata.team)
    }
    else{
     req.body.teamid =jsdata.team
    }
    if(typeof(jsdata.other)=='string'){
      req.body.othersid=JSON.parse(jsdata.other)
    }
    else{
     req.body.othersid =jsdata.other
    }
   console.log(req.body.othersid)
   console.log(req.body.teamid)
   console.log(req.body.recruiter_name)
        therole=await myroles.findOne({_id:req.user.user.role,branchid:req.user.user.branchid});
        if(therole.cj==1){
            jobs.findOneAndUpdate({_id:req.body.eid},req.body,(err,data)=>{
                if(!err){
                    if(data){
                    console.log(data)
                    res.send({message:"data saved successfully",status:1})
                }
                else{
                    res.send({message:"unsuccessful save",status:0})
                }
                }
                else{
                    res.send({message:"unable to save",status:0})
                }
            
            })
        }
    }
    }
  else{
    res.send({message:"Invalid or expired token",status:2})
  }
  
  })           

app.post("/roles",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
if(req.user!=0){
console.log(req.body)
myroles.find({branchid:req.user.user.branchid,role:{$ne:"99"},role:{$ne:"1"}},('rolename role'),(err,data)=>{
console.log(data)
        res.send({data:data,status:1,token:req.body.token})
    })
}
else{
res.send({message:"Invalid or expired token",status:2})
}
}) 

app.post("/logsfilter",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const todaydate1=moment(indian_date).format("YYYY-MM-DD")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    console.log(req.body)
    if(req.user!=0){
    if(req.body.logs==1){
    if(req.body.fdate=='Invalid date'||!req.body.fdate||req.body.fdate==''){
    date1=todaydate1
    }
    else{
    date1=req.body.fdate
    }
     if(req.body.tdate=='Invalid date'||!req.body.tdate||req.body.tdate==''){
    date2=todaydate1
    }
    else{
    date2=req.body.tdate
    }
    console.log(date1)
    console.log(date2)
    userlogs.find({userid:req.body.user,qdate:{$gte:date1,$lte:date2}},(err,data1)=>{
    if(!err){
    if(data1.length>1){
    newdat=[]
    console.log(data1)
    i=data1.length
    console.log(i)
    newdat.push(data1[i-1])
    console.log(newdat)
    }
    else{
     console.log(data1)
    newdat=data1
    }
        console.log(newdat)
    res.send({data:data1,status:1,data1:newdat})
    
    }
    })
    }
    else{
    console.log("#2")
    User.find({branchid:req.user.user.branchid},(err,data)=>{
    userlogs.find({userid:data[0]._id,date:todaydate},(err,data1)=>{
    if(!err){
    if(data1.length>1){
    newdat=[]
    console.log(data1)
    i=data1.length
    console.log(i)
     newdat.push(data1[i-1])
     console.log(newdat)
    }
    else{
     console.log(data1)
    newdat=data1
    }
    res.send({data:data1,status:1,data1:newdat})
    }
    })
    })  
    }
    }
    
    else{
    res.send({message:"Invalid or expired token",status:2})
    }
    }) 



app.post("/reqid",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
    if(req.user!=0){
        if(req.user.user.roleid=="1"){
        querry={}
        }
        else{
        querry={$or:[{userid:req.user.user._id},{"othersid._id":{$in:[req.user.user._id]}},{"teamid._id":{$in:[req.user.user._id]}}]}
        }
        jobs.find({$and:[{branchid:req.user.user.branchid},querry]},'jobid',(err,data)=>{
            if(err)
            {
                res.send({message:err,status:0})
            }
            else{
                res.send({data:data,status:1,token:req.body.token})
            }
           
        })
    }
    else{
    res.send({message:"Invalid or expired token",status:2})
    }
    })
app.post("/commercials",verifytoken,(req, res)=> {
console.log(req.body)
    if(req.user!=0){
    if(req.user.user.roleid=="1"){
        querry={}
        }
        else{
        querry={$or:[{userid:req.user.user._id},{othersid:{$regex:req.user.user._id,$options:"i"}},{teamid:{$regex:req.user.user._id,$options:"i"}}]}
        }
      jobs.findOne({jobid:req.body.jobid},async(err,data)=>{
      if(data){
       var data1 = await client.findOne({_id:data.cid,branchid:req.user.user.branchid},'payments')
       if (data1){
      res.send({status:1,data:data1})
      }
      else{
      res.send({status:0,data:[]})
      }
      }
      else{
      res.send({status:0,data:[]})
      }
      })
    }
    else{
    res.send({message:"Invalid or expired token",status:2})
    }
    })
app.post("/filecomment",verifytoken,(req, res)=> { 
console.log("filecomment")
console.log(req.body)
console.log(req.user)
comments.find({fileid:req.body.fileid,branchid:req.user.user.branchid},(err,data)=>{
if(!err){
if(data){
res.send({status:1,data:data})
}
}
else{
res.send({message:err,status:0})
}
})
}) 
app.post("/userdata",verifytoken,(req, res)=> { 
User.find({branchid:req.user.user.branchid},(err,data)=>{
if(!err){
if(data){
res.send({status:1,data:data})
}
}
else{
res.send({message:err,status:0})
}
})
}) 
app.post("/addcomment", verifytoken,(req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    const year = mydatee.getFullYear() 
    const month = localm+1
    const fmonth = "0"+month
    console.log(req.body)
        if(res.user!=0){
        
        const {userid,uname,name,interested,cname,namejob,cstatus,jobid,revenue} = req.body
            var dt = new Date();
            const todaywt=moment(dt).format("DD-MM-YYYY")
             if(req.body.interested=="Not Interested"||req.body.interested=="Not Willing to Change"){
                     const mycomm =new comments({
                                         userid:req.user.user._id,
                                        name:req.body.name,
                                        compname:req.body.cname,
                                        interested,
                                        fileid:req.body.fileid,
                                        date:todaydate,
                                        namejob,
                                        branchid:req.user.user.branchid,
                                        offerdate:"",
                                        joindate:"",
                                        num:0
                                        })
                                    mycomm.save(err=>{
                                    if(!err){
                                    res.send({status:1,message:"done"})
                                    }
                                    else{
                                    res.send({status:0,message:err})
                                    }
                                    })
                    }
                    else{
            jobs.findOne({jobid:req.body.jobid},(err,data)=>{
                if(!err){
                    if(data&&req.body.jobid&&req.body.jobid!=''){
                    if(req.body.interested=="Interested"&&req.body.status!=''){
                                    const mycomm =new comments({
                                        userid:req.user.user._id,
                                        name:req.body.name,
                                        compname:data.compname,
                                        interested,
                                        cname:data.cname,
                                        namejob,
                                        status:req.body.status,
                                        jobid:data.jobid,
                                        revenue:0,
                                        ctc:0,
                                        billing:0,
                                        num:1,
                                        offerdate:"",
                                        joindate:"",
                                        branchid:req.user.user.branchid,
                                        date:todaydate,
                                        invoice:"",
                                        fileid:req.body.fileid
                                        
                                    })
                                      mycomm.save(err => {
                                        if(err) {
                                            res.send(err,"unable to upload")
                                        } else {
                                            status.findOneAndUpdate({userid:req.user.user._id,date:todaydate},{$inc:{stc:1}},(err,stat)=>{
                                                if(!err){
                                                    if(stat){
                                                        console.log("done")
                                                    }
                                                }
                                              if(parseInt(month)>9){
                                              m=month
                                              }
                                              else{
                                              m="0"+month
                                              }
                                                mstatus.findOneAndUpdate({userid:req.user.user._id,month:m},{$inc:{stc:1}},(err,stat1)=>{
                                                    if(!err){
                                                        if(stat1){
                                                            console.log("done2")
                                                        }
                                                    }
                                                })
                                            })
                                            res.send( { message: "Successfully Added",status:1 })
                                        }
                                    })
                                    }
                                    
                                    else{
                                    res.send({message:"please include status",status:0})
                                    }
                                  
                       
                    }
                 
                    else{
                        res.send({message:"unable to find data please try later",err:err,status:0})
                    }    
        }
        else{
            res.send({message:err,status:0})
        }  
        })
    }
        }
        else{
        res.send({message:"Invalid or expired token",status:2}) 
        }    
        })


app.post("/viewjobs",verifytoken,async(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const todaydate1=moment(indian_date).format("YYYY-MM-DD")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
var timedata= await checktime(req.user.user)
console.log(req.body)
    if(req.user!=0&&timedata==1){
       if((req.body.userid || req.body.jobid || req.body.fdate|| req.body.tdate)&&( req.body.token)){
       console.log("querried")
       if(req.body.userid){
        if((req.body.userid!='0'&&req.body.userid!='')){
      
         querry={ $or:[{userid:req.body.userid},{"othersid._id":{$in:[req.body.userid]}},{"teamid._id":{$in:[req.body.userid]}}]}
        }
        else{
        querry={}
        }}
        else{
        querry={}
        }
          if((req.body.jobid&&req.body.jobid!='0'&&req.body.jobid!='')){
          querry2={jobid:req.body.jobid}
          }
          else{
          querry2={}
          }
        if(req.body.fdate&&req.body.fdate!='Invalid date'&&req.body.fdate!=''){
        querry1={qdate:{$gte:req.body.fdate}}
         
        }
        else{
        querry1={}
        } 
        if(req.body.tdate&&req.body.tdate!='Invalid date'&&req.body.tdate!=''){
        querry3={qdate:{$lte:req.body.tdate}}
        }
        else{
        querry3={}
        }
        
        const isEmpty = Object.keys(querry).length === 0;
        const isEmpty1 = Object.keys(querry1).length === 0;
        const isEmpty2 = Object.keys(querry2).length === 0;
        const isEmpty3 = Object.keys(querry3).length === 0;
        console.log(isEmpty)
        if(isEmpty&&isEmpty1&&isEmpty2&&isEmpty3){
        querry1={date:todaydate1}
        } 
        console.log(querry)
        console.log(querry1)
        console.log(querry2)
        console.log(querry3)
            jobs.find({$and:[querry,querry1,querry2,querry3,{branchid:req.user.user.branchid}]},(err,data)=>{
              if(!err){
                  if(data){
                      console.log(data)
                      res.send({message:"data found",data:data,status:1,date1:req.body.fdate,date2:req.body.tdate,userid:req.body.userid,jobid:req.body.jobid})
                  }
                  else{
                  console.log(err);
                      res.send({message:"data not foundfor your branch",status:0})
                  }
              }
              else{
                  console.log(err);
                  res.send({message:"unable to find please try later",err:err,status:0})
              }
          
          })
        }
        else{
        console.log("default")
        userid=req.user.user._id
        console.log("here")
            jobs.find({$and:[{date:todaydate},{branchid:req.user.user.branchid},{ $or:[{userid:[userid]},{"othersid._id":{$in:[userid]}},{"teamid._id":{$in:[userid]}}]}]},async(err,data)=>{
                if(!err){
                    if(data){
                        
                        console.log(data)
                        res.send({data:data,meaage:"all datas",date1:todaydate,date2:todaydate,userid:req.user.user._id})
                    }
                    else{
                    console.log(err);
                        res.send({message:"data not foundfor your branch",status:0})
                    }
                }
                else{
                    console.log(err);
                    res.send({message:"unable to find please try later",err:err,status:0})
                }
            
            })
        
        }
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  
  })


app.put("/statusedit",verifytoken,async(req, res)=> {

let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
var usr=await comments.findOne({_id:req.body.eid});
temp=usr.date.split('-')
smonth=temp[1]

  console.log(req.body)
  console.log(req.user.user._id+"myuser")
  const num= await getnumber(req.body.status)
  
      if(req.user!=0){
          const mydata = req.body
      if(req.body.status=="Offered"){
      mydata.revenue=(parseInt(req.body.ctc)*parseFloat(req.body.billing))/100
      
      mydata.offerdate=req.body.offered
      mydata.modified=today
      mydata.num=num
      }
       if(req.body.status=="Joined"){
       mydata.joindate=req.body.joined
       mydata.modified=today
       mydata.num=num
      }
      
      if(usr){
      if (usr.status=="Feedback Pending" && req.body.status=="Schedule Interview"){
          mydata.num=num
          comments.findOneAndUpdate({_id:req.body.eid},mydata,(err,usr1)=>{if(!err){if(usr1){console.log("done21")}}})
          status.findOneAndUpdate({userid:req.user.user._id,date:usr.date},{$inc:{FP:-1}},(err,cstatus)=>{if(!err){if(cstatus){console.log("done22")}}})
          mstatus.findOneAndUpdate({userid:req.user.user._id,month:smonth},{$inc:{FP:-1}},(err,cstatus)=>{
          if(!err){
           updatestatus(usr,req.body,req.user.user._id,usr)
          res.send({message:"updated successfully",status:1})
          }
          else{
          res.send({message:err,status:0})
          }
          })  
      }
        
        else if ((usr.status=="Offered Yet-to-Join" && req.body.status!="Offered Yet-to-Join")&&req.body.status=="Joined"){
             console.log("#1")
             q=thisfunc()
             console.log(mydata)
            console.log(q)
            comments.findOneAndUpdate({_id:req.body.eid},mydata,(err,usr1)=>{if(!err){if(usr1){console.log("done23")}}})
            status.findOneAndUpdate({userid:req.user.user._id,date:usr.date},{$inc:{YTJ:-1,YTJR:-usr.revenue,J:1,JR:usr.revenue}},(err,cstatus)=>{
            if(err){console.log(err)}
            if(!err){if(cstatus){console.log("done24")}}})
            mstatus.findOneAndUpdate({userid:req.user.user._id,month:smonth},{$inc:{YTJ:-1,YTJR:-usr.revenue,J:1,JR:usr.revenue}},async(err,cstatus)=>{
            if(err){console.log(err)}
            })  
           
         
            var temp = req.user.user.leader
            console.log(req.user.user._id)
            dothis(temp,usr,q)
            console.log("#1.1")
            const mytarget = await target.findOne({user_id:req.user.user._id,Q:q.q})
              console.log(mytarget+"thistarget")
            mytarget.compleation+=usr.revenue
            mytarget.perc=Math.floor((mytarget.compleation/mytarget.Qtarget)*100)
             if(q.m==1){
             console.log("#m1")
                mytarget.m1total+=usr.revenue
                mytarget.m1=Math.floor((mytarget.m1total/(mytarget.Qtarget/3))*100)
                }
                else if(q.m==2){
                console.log("#m2")
                mytarget.m2total+=usr.revenue
                mytarget.m2=Math.floor((mytarget.m2total/(mytarget.Qtarget/3))*100)
                }
                else if(q.m==3){
                console.log("#m3")
                mytarget.m3total+=usr.revenue
                mytarget.m3=Math.floor((mytarget.m3total/(mytarget.Qtarget/3))*100)
                console.log(mytarget+"#done")
                }
            mytarget.save(err=>{
            if(!err){
            console.log("sent")
            res.send({message:"done",status:1})
            }
            else{
            res.send({message:err,status:0}) 
            }
            })
            }
        

      else if(req.body.status=="Joined"){
       console.log("#2")
       q=thisfunc()
       
      
          comments.findOneAndUpdate({_id:req.body.eid},mydata,(err,usr1)=>{if(!err){if(usr1){console.log("done23")}}})
          status.findOneAndUpdate({userid:req.user.user._id,date:usr.date},{$inc:{J:1,JR:usr.revenue}},(err,cstatus)=>{if(!err){if(cstatus){console.log("done24")}}})
          mstatus.findOneAndUpdate({userid:req.user.user._id,month:smonth},{$inc:{J:1,JR:usr.revenue}},(err,cstatus)=>{})
         
          console.log(q)
          var temp = req.user.user.leader
          console.log("#2.0")
          dothis(temp,usr,q)
          console.log("#2.1")
          console.log("ontonext")
          const mytarget = await target.findOne({user_id:req.user.user._id,Q:q.q})
          mytarget.compleation+=usr.revenue
          console.log(mytarget+"thistarget")
          mytarget.perc=Math.floor((mytarget.compleation/mytarget.Qtarget)*100)
           if(q.m==1){
                mytarget.m1total+=usr.revenue
                mytarget.m1=Math.floor((mytarget.m1total/(mytarget.Qtarget/3))*100)
                }
                else if(q.m==2){
                mytarget.m2total+=usr.revenue
                mytarget.m2=Math.floor((mytarget.m2total/(mytarget.Qtarget/3))*100)
                }
                else if(q.m==3){
                mytarget.m3total+=usr.revenue
                mytarget.m3=Math.floor((mytarget.m3total/(mytarget.Qtarget/3))*100)
                }
          mytarget.save(err=>{
          if(!err){
          console.log("sent")
          res.send({message:"done",status:1})
          }
          else{
          res.send({message:err,status:0})
          }
          })
      
      }
      
          else{
          
          mydata.num=num
              console.log('hello')
              comments.findOneAndUpdate({_id:req.body.eid},mydata,(err,usr1)=>{
                  if(!err){
                  if(usr1){
                      updatestatus(usr,req.body,req.user.user._id,usr1)
                      res.send({message:"updated successfully",user:usr,status:1})
                      console.log(usr1+"updated")
                      }
                    
                  
              }
              else{
                  console.log(err)
              }
          })
          }
      }
      else{
      
      res.send({message:"data not found",status:0})
      }
      }
      else{
      
         res.send({message:"Invalid or expired token",status:2})
      
      }
      
      })
 app.post("/hierarchy",verifytoken,async(req, res)=> {
 let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(res.user!=0){
    var role1=[]
    var role2=[]
    var role3=[]
    var role4=[]
    var role5=[]
    var data5= await myroles.findOne({branchid:req.user.user.branchid}).sort({role:-1}).limit(1)
    
    if(req.user.user.roleid=="1"||req.user.user.roleid=="99"){
       role1=await User.find({$and:[{$or:[{roleid:"1"},{roleid:"99"}]},{branchid:req.user.user.branchid}]})
         role2=await User.find({roleid:"2",branchid:req.user.user.branchid});
         role3=await User.find({roleid:"3",branchid:req.user.user.branchid});
         role4=await User.find({roleid:"4",branchid:req.user.user.branchid});
         role5=await User.find({roleid:"5",branchid:req.user.user.branchid});
    }
    else if(req.user.user.roleid=="2"){
    if(req.user.user.roleid==data5.role){
      role1=await User.find({_id:req.user.user._id});
      }
      else{
      role1=await User.find({roleid:"2",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
         role2=await User.find({roleid:"3",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
         role3=await User.find({roleid:"4",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
         role4=await User.find({roleid:"5",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
       }
    
    }
            else if(req.user.user.roleid=="3"){
            if(req.user.user.roleid==data5.role){
      role1=await User.find({_id:req.user.user._id});
      }
      else{
      role1=await User.find({roleid:"3",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
         role2=await User.find({roleid:"4",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
         role3=await User.find({roleid:"5",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
     
       }
    
    }
        else if(req.user.user.roleid=="4"){
        if(req.user.user.roleid==data5.role){
      role1=await User.find({_id:req.user.user._id});
      }
      else{
      role2=await User.find({roleid:"4",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
         role3=await User.find({roleid:"5",branchid:req.user.user.branchid,teamid:req.user.user.teamid});
      }
        

       
    
    }
        
         res.send({role1:role1,role2:role2,role3:role3,role4:role4,role5:role5,therole:data5})
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
  
 app.post("/myjob",verifytoken,async(req, res)=> {
 let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
 console.log(req.body)
    if(res.user!=0){
  jobs.findOne({_id:req.body.eid},(err,data)=>{
  if(data){
  res.send({status:1,data:data})
  }
  else{
  res.send({status:1,data:[]})
  }
  })
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
   app.post("/userview",verifytoken,async(req, res)=> {
 console.log(req.body)
    if(res.user!=0){
  profile.findOne({_id:req.body.fileid},(err,data)=>{
  console.log(data)
  data.viewed=data.viewed+1
  data.save();
  userview.findOne({userid:req.body.userid,fileid:req.body.fileid},(err,data1)=>{
  if(data1){
  data1.viewed=data1.viewed+1
  data1.save(err=>{
  if(!err){
  res.send({status:1,message:"done"})
  }
  else{
  console.log(err)
  }
  });
  }
  else{
  data1=new userview({
  userid:req.body.userid,
  fileid:req.body.fileid,
  viewed:1
  })
  data1.save(err=>{
  if(!err){
  res.send({status:1,message:"done"})
  }
  else{
  console.log(err)
  }
  });
  }
  })
  })
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
   app.post("/candidateedit",verifytoken,async(req, res)=> {
   let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
 console.log(req.body)
    if(res.user!=0){
  comments.findOne({_id:req.body.eid},(err,data)=>{
  if(data){
  res.send({status:1,data:data})
  }
  else{
  res.send({status:1,data:[]})
  }
  })
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
   app.post("/myclient",verifytoken,async(req, res)=> {
 console.log(req.body)
    if(res.user!=0){
  client.findOne({_id:req.body.eid},(err,data)=>{
  if(data){
  res.send({status:1,data:data})
  }
  else{
  res.send({status:1,data:[]})
  }
  })
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
  app.post("/givestatus",verifytoken,async(req, res)=> {
  let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(res.user!=0){
    var c= req.body.status
        if (c == "STC-Sent to Client"){
        r= ['Feedback Pending', 'Schedule Interview']
        }
    else if (c == "Feedback Pending"){
        r= ['Schedule Interview']
        }
    else if (c == "Schedule Interview" ){
        r= ['Interview No-show', 'Interview Completed', 'FIC - Final Interview Completed', 'Documents Submitted']
        }
    else if (c == "Interview No-show"){
        r= [ ]
        }
    else if (c == "Interview Completed"){
        r= ['FIC - Final Interview Completed', 'Documents Submitted']
        }
    else if (c == "FIC - Final Interview Completed"){
        r= ['Documents Submitted', 'Offered']
        }
    else if (c == 'Documents Submitted'){
        r= ['Offered', 'Offered Yet-to-Join']
        }
    else if (c == 'Offered'){
        r= ['Offered Yet-to-Join', 'Offer Declined', 'Offered Ghosting', 'Not Joined', 'Joined',
                'Joined Left before RED (Replacement End Date)']
                }
    else if(c=="Offered Ghosting"){
    r=[]
    }
    else if(c=="Offer Declined"){
    r=[]
    }
     else if(c=="Not Joined"){
    r=[]
    }
    else if (c == 'Offered Yet-to-Join'){
        r= ['Not Joined', 'Joined']
        }
    else if (c == 'Joined'){
        r= ['Joined Left before RED (Replacement End Date)']
        }
        res.send({status:1,data:r})
    }
    else{
        res.send({message:"invalid or expired token",status:2})
    }
  })
app.post("/addleaders",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
       if(req.user.user.roleid=="1"||req.user.user.roleid=="99"){
               User.find({branchid:req.user.user.branchid},(err,data)=>{
                   if(data){
                       res.send({message:"found",data:data,status:1})
                   }
   
               })
       }
        else if(req.user.user.roleid=="2"){
    
       User.find({branchid:req.user.user.branchid,roleid:"3",leader:req.user.user._id},(err,data)=>{
       console.log(data)
        if(data){
        const newdata=myfunction(data,req.user)
        console.log(newdata)
        }
        else{
        res.send("not found")
        }
       
       })
    }
    }
   
   })    
    
app.post("/usernames",verifytoken,async (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
    if(req.user.user.roleid=="1"||req.user.user.roleid=="99"){
        User.find({branchid:req.user.user.branchid},'name',(err,data)=>{
            if(!err){
                res.send({status:1,data:data})
            }
        })
    }
    else if(req.user.user.roleid=="2"){
           User.find({branchid:req.user.user.branchid,$or:[{roleid:"2"},{roleid:"3"},{roleid:"4"},{roleid:"5"},{roleid:"6"},{roleid:"7"},{roleid:"8"},{roleid:"9"}],teamid:req.user.user.teamid},'name',(err,data)=>{
            if(!err){
                if(data){
                    res.send({status:1,data:data})
                }
            }
           })
    }
     else if(req.user.user.roleid=="3"){
           User.find({branchid:req.user.user.branchid,$or:[{roleid:"3"},{roleid:"4"},{roleid:"5"},{roleid:"6"},{roleid:"7"},{roleid:"8"},{roleid:"9"}],teamid:req.user.user.teamid},'name',(err,data)=>{
            if(!err){
                if(data){
                    res.send({status:1,data:data})
                }
            }
           })
    }
      else if(req.user.user.roleid=="4"){
           User.find({branchid:req.user.user.branchid,$or:[{roleid:"5"},{roleid:"6"},{roleid:"7"},{roleid:"8"},{roleid:"9"}],teamid:req.user.user.teamid},'name',(err,data)=>{
            if(!err){
                if(data){
                    res.send({status:1,data:data})
                }
            }
           })
    }
    }
    else{
        res.send({message:"Invalid or expired token",status:2})
    }
    })
    app.post("/mynames",verifytoken,async (req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
   User.find({branchid:req.user.user.branchid},(err,data)=>{
   if(!err){
   if(data){
   res.send({status:1,data:data})
   }
   }
   })
    }
    else{
        res.send({message:"Invalid or expired token",status:2})
    }
    })
app.post("/gettargets",verifytoken,async (req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
    var Q1=await target.find({branchid:req.user.user.branchid,Q:1,year:req.body.year})
    var Q2=await target.find({branchid:req.user.user.branchid,Q:2,year:req.body.year})
    var Q3=await target.find({branchid:req.user.user.branchid,Q:3,year:req.body.year})
    var Q4=await target.find({branchid:req.user.user.branchid,Q:4,year:req.body.year})
    res.send({status:1,Q1:Q1,Q2:Q2,Q3:Q3,Q4:Q4})
    
 }
 else{
 res.send({message:"Invalid or expired token",statsu:2})
 }
   
   })

app.post("/getleader",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
    if(req.user!=0){
    
    User.findOne({_id:req.body.eid},'name',(err,data)=>{
    if(!err){
    if(data){
    console.log(data);
    res.send({message:"data",leader:data,status:1})
    }
    else{
    res.send({message:err,status:0})
    }
    }
       
    })
   }
   else{
   res.send({message:"Invalid or expired token",status:2})
   }
   
   })


app.post("/activity",verifytoken,(req, res)=> {
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
    if(req.user!=0){
      User.findOne({_id:req.body.eid},(err,data)=>{
      if(!err){
      if(data){
         if(data.activity==0){
            data.activity=1
             
            data.save();
            
         }
         else{
          data.activity=0
            data.save();
            
         }
         res.send({message:"done",status:1})
      }
      else{
      res.send({message:"failed",status:0})
      }
      }
      else{
      req.send({message:"an error occured",status:0})
      }
      })
   }
   else{
   res.send({message:"Invalid or expired token",status:2})
   }
   
   })
   
app.post("/addinvoice",verifytoken,(req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    const year = mydatee.getFullYear() 
    const month = localm+1
    const fmonth = "0"+month
    console.log(req.body)
        if(req.user!=0){
            comments.findOneAndUpdate({_id:req.body.eid},{invoice:req.body.filename},(err,data)=>{
                if(err){
                console.log(err);
                }
                else{
                    res.send({status:1,message:"done"})
                }
                })
      
       }
       else{
       res.send({message:"Invalid or expired token",status:2})
       }
       
       })
       app.post("/viewinvoice",verifytoken,(req, res)=> {
    let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
    const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
    const todaydate=moment(indian_date).format("DD-MM-YYYY")
    const mydatee=new Date()
    const localm = mydatee.getMonth() 
    const year = mydatee.getFullYear() 
    const month = localm+1
    const fmonth = "0"+month
    console.log(req.body)
        if(req.user!=0){
            comments.findOne({_id:req.body.eid},(err,data)=>{
                if(err){
                console.log(err);
                }
                else{
                    res.send({status:1,message:"done",data:data})
                }
                })
      
       }
       else{
       res.send({message:"Invalid or expired token",status:2})
       }
       
       })
      
   app.post("/reportstatus",verifytoken,(req, res)=> {
   let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month
console.log(req.body)
    if(req.user!=0){
    comment.find({userid:req.body.userid,date:req.body.date,num:{gt:req.body.num}},(err,data)=>{  
    if(data){
    res.send({status:1,data:data})
    }
    else{
res.send({status:1,data:[]})
    }
    })
  
    
   }
   else{
   res.send({message:"Invalid or expired token",status:2})
   }
   
   })
function myfunction(data,user){
var newarr=[]
   data.forEach(element=>{
            User.findOne({branchid:user.user._id,roleid:"4",leader:element._id},(err,data1)=>{
                if(data1){
                    newarr.push(data1)
                    newarr.push(element)
                }
                else{
                    newarr.push(data1)
                }
            })
        });
        console.log(newarr);
        return newarr
}
async function getnumber(data){
var num=0
if(data=="Feedback Pending"){
num=2
}
else if (data=="Schedule Interview"){
num=3
}
else if (data=="Interview No-show"){
num=4
}
else if (data=="Interview Completed"){
num=5
}
else if (data=="FIC - Final Interview Completed"){
num=6
}
else if (data=="Documents Submitted"){
num=7
}
else if (data=="Offered"){
num=8
}
else if (data=="Offered Yet-to-Join"){
num=9
}
else if (data=="Offer Declined"){
num=10
}
else if (data=="Offered Ghosting"){
num=11
}
else if (data=="Not Joined"){
num=12
}
else if (data=="Joined"){
num=13
}
else if (data=="Joined Left before RED (Replacement End Date)"){
num=14
}
return num
}



function updatestatus (data1,data2,data3,data4){
    var thisdate=data4.date

    mydate=thisdate.split('-')
    console.log(mydate)
    umonth=mydate[1]
    if (data2.status=="Feedback Pending"){
    
        status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{FP:1}},(err,cstatus)=>{
        if(!err){
        if(cstatus){
        console.log(cstatus);
        }
        }
        else{
        console.log(err);
        }
            mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{FP:1}},(err,cstatus)=>{
            })
                }) 
    }
    if (data2.status=="Schedule Interview"){
        status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{IS:1}},(err,cstatus)=>{
            mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{IS:1}},(err,cstatus)=>{
            })
            }) 
    }
        if (data2.status=="Interview No-show"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{INS:1}},(err,cstatus)=>{
                mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{INS:1}},(err,cstatus)=>{
                })
            }) 
        }
            if (data2.status=="Interview Completed"){
                status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{IC:1}},(err,cstatus)=>{
                    mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{IC:1}},(err,cstatus)=>{
                    })
            }) 
            }
                if (data2.status=="FIC - Final Interview Completed"){
    status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{FIC:1}},(err,cstatus)=>{
        mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{FIC:1}},(err,cstatus)=>{
        })
            }) 
    }if (data2.status=="Documents Submitted"){
        status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{DC:1}},(err,cstatus)=>{
            mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{DC:1}},(err,cstatus)=>{
            })
            }) 
    }
        if (data2.status=="Offered"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{OFF:1,CTC:data2.ctc}},(err,cstatus)=>{
                mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{OFF:1,CTC:data2.ctc}},(err,cstatus)=>{
                })
            }) 
        }
        if (data2.status=="Offered Yet-to-Join"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{YTJ:1,YTJR:data4.revenue}},(err,cstatus)=>{
                mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{YTJ:1,YTJR:data4.revenue}},(err,cstatus)=>{
                })
            }) 
        }
        if (data2.status=="Offer Declined"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{OD:1}},(err,cstatus)=>{
                mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{OD:1}},(err,cstatus)=>{
                })
            }) 
        }if (data2.status=="Offered Ghosting"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{OG:1}},(err,cstatus)=>{
                mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{OG:1}},(err,cstatus)=>{
                })
            }) 
        }
        if (data2.status=="Joined"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{J:1,JR:data4.revenue}},(err,cstatus)=>{
            mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{J:1,JR:data4.revenue}},(err,cstatus)=>{
                        })
            }) 
            
        }
        if (data2.status=="Not Joined"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{NJ:1,NJR:data4.revenue}},(err,cstatus)=>{
            mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{NJ:1,NJR:data4.revenue}},(err,cstatus)=>{
                        })
            }) 
            
        }
        if (data2.status=="Joined Left before RED (Replacement End Date)"){
            status.findOneAndUpdate({userid:data3,date:thisdate},{$inc:{JRED:1,}},(err,cstatus)=>{
                        mstatus.findOneAndUpdate({userid:data3,month:umonth},{$inc:{JRED:1}},(err,cstatus)=>{
                        })  
            }) 
            
        }
    }
function verifytoken (req,res,next){
    
    const bearerHead = req.body.token;
    if(typeof bearerHead!=='undefined')
    {
        const bearer = bearerHead.split(' ')
        req.juuztoken = bearer[1];
        jwt.verify(req.juuztoken,process.env.JSSW,(err,thedata)=>{
            if(err){
                req.user=0
                next();
            }
            else{
                req.user=thedata
                next();
            }
        })
        
    }
    else{
        req.user=0
        next();
    }
}
function  validateInput  (rowData) {
    const schema = joi.object().keys({
        name:joi.string(),
        username:joi.string().email().required(), 
        password: joi.string().min(8).max(16).required(),
        role:joi.string(),
        leader:joi.string(),
        token:joi.string()
    }); 
    return schema.validate(rowData)
  }
function checkmdata(userid,tdt){
     if(parseInt(tdt.month)>9){
     month=tdt.month
     }
     else{
     month=tdt.fmonth
     }
    mstatus.findOne({month:tdt.fmonth,userid:userid},(err,data)=>{
        if (!err){
            if(!data){
                console.log("saving");
                const addstatus = new mstatus({
                    userid:userid,
                    stc:0,
                    FP:0,
                    IS:0,
                    INS:0,
                    IC:0,
                    FIC:0,
                    DC:0,
                    OFF:0,
                    YTJ:0,
                    OD:0,
                    OG:0,
                    NJ:0,
                    J:0,
                    JRED:0,
                    CTC:0,
                    YTJR:0,
                    JR:0,
                    NJR:0,
                    month:month
                    })
                    console.log("done monthly");
                    addstatus.save();

            }
        }

    })
}

function checkif(userid,tdt)

{
status.findOne({date:tdt.todaydate,userid:userid},(err,data)=>{
    checkmdata(userid,tdt)
    if(!err){
        if(!data){
            const addstatus = new status({
                userid:userid,
                stc:0,
                FP:0,
                IS:0,
                INS:0,
                IC:0,
                FIC:0,
                DC:0,
                OFF:0,
                YTJ:0,
                OD:0,
                OG:0,
                NJ:0,
                J:0,
                JRED:0,
                CTC:0,
                YTJR:0,
                JR:0,
                NJR:0,
                date:tdt.todaydate
                })
                console.log("done daily")
                addstatus.save();
        }
    }

    
})
}function thisfunc(){
let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month

    if(month==4||month==5||month==6){
        if(month==4||month==7||month==10||month==1){
        m=1
        }
          else if(month==4||month==7||month==10){
        m=1
        }
          if(month==5||month==8||month==11||month==2){
        m=2
        }
          if(month==6||month==9||month==12||month==3){
        m=3
        }
          q=1
        }
        
        
        else if(month==7||month==8||month==9){
        if(month==4||month==7||month==10||month==1){
        m=1
        }
          else if(month==4||month==7||month==10){
        m=1
        }
          if(month==5||month==8||month==11||month==2){
        m=2
        }
          if(month==6||month==9||month==12||month==3){
        m=3
        }
        q=2
        }
        else if(month==10||month==11||month==12){
        if(month==4||month==7||month==10||month==1){
        m=1
        }
          else if(month==4||month==7||month==10){
        m=1
        }
          if(month==5||month==8||month==11||month==2){
        m=2
        }
          if(month==6||month==9||month==12||month==3){
        m=3
        }
        q=3
        }
        else if(month==1||month==2||month==3){
        if(month==4||month==7||month==10||month==1){
        m=1
        }
          else if(month==4||month==7||month==10){
        m=1
        }
          if(month==5||month==8||month==11||month==2){
        m=2
        }
          if(month==6||month==9||month==12||month==3){
        m=3
        }
        q=4
        }
        thisdat={
        q:q,
        m:m
        }
        return thisdat
}
async function dothis (temp,usr,q){
       while(temp!="0"){     
                const datas = await User.findOne({_id:temp});
                if(datas.roleid!="99"){
                const qtarget = await target.findOne({user_id:datas._id,Q:q.q})
                console.log(qtarget)
                qtarget.compleation+=usr.revenue
                qtarget.perc=Math.floor((qtarget.compleation/qtarget.Qtarget)*100)
                if(q.m==1){
                console.log("1")
                qtarget.m1total+=usr.revenue
                qtarget.m1=Math.floor((qtarget.m1total/(qtarget.Qtarget/3))*100)
                }
                else if(q.m==2){
                console.log("1")
                qtarget.m2total+=usr.revenue
                qtarget.m2=Math.floor((qtarget.m2total/(qtarget.Qtarget/3))*100)
                }
                else if(q.m==3){
                console.log("1")
                qtarget.m3total+=usr.revenue
                qtarget.m3=Math.floor((qtarget.m3total/(qtarget.Qtarget/3))*100)
                }
                qtarget.save(err=>{
                if(err){
                console.log(err);
                }
                })
                console.log("done")
            }
            else{
            }
            temp=datas.leader
            }
}
async function newtarget (temp,prev,usr,q){
       while(temp!="0"){     
                const datas = await User.findOne({_id:temp});
                if(datas.roleid!="99"){
                const qtarget = await target.findOne({user_id:datas._id,Q:q.q})
                console.log(qtarget)
                qtarget.Qtarget-=parseInt(prev);
                qtarget.Qtarget+=parseInt(usr.Qtarget)
                qtarget.perc=Math.floor((qtarget.compleation/qtarget.Qtarget)*100)
                if(q.m==1){
                console.log("1")
                qtarget.m1=Math.floor((qtarget.m1total/(qtarget.Qtarget/3))*100)
                }
                else if(q.m==2){
                console.log("1")

                qtarget.m2=Math.floor((qtarget.m2total/(qtarget.Qtarget/3))*100)
                }
                else if(q.m==3){
                console.log("1")
          
                qtarget.m3=Math.floor((qtarget.m3total/(qtarget.Qtarget/3))*100)
                }
                qtarget.save(err=>{
                if(err){
                console.log(err);
                }
                })
                console.log("done")
            }
            else{
            }
            temp=datas.leader
            }
}

async function checktime(data){
console.log("here")
if(data.roleid=="99" || data.roleid=="1"){
console.log("#1");
return 1
}
else {
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const d = new Date();
let day = weekday[d.getDay()];
const user= await access.findOne({day:day,branchid:data.branchid});
let date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const time=moment(date).format("HH:mm")
if (time>=user.fromtime&&time<=user.totime){
console.log("#2");
return 1
}
else{
console.log("#3");
return 0
}

}
}
async function accesscreate(data){
access.insertMany([
   {day:"Sunday",fromtime:"00:00",totmine:"00:00",branchid:data._id},{day:"Monday",fromtime:"09:30",totime:"18:30",branchid:data._id},{day:"Tuesday",fromtime:"09:30",totime:"18:30",branchid:data._id},{day:"Wednesday",fromtime:"09:30",totime:"18:30",branchid:data._id},{day:"Thursday",fromtime:"09:30",totime:"18:30",branchid:data._id},{day:"Friday",fromtime:"09:30",totime:"18:30",branchid:data._id},{day:"Saturday",fromtime:"09:30",totime:"13:30",branchid:data._id}
])
return 1 


}
async function savelogs(data,data1,tdt){
   let indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});
const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("YYYY-MM-DD")
var data5= await userlogs.findOne({userid:data1._id,date:tdt.todaydate}).sort({numtime:-1}).limit(1)
if(!data5){
const tlogs = new userlogs({
userid:data1._id,
name:data1.name,
date:tdt.todaydate,
qdate:todaydate,
ipaddress:data.ipaddress,
devicetype:data.devicetype,
logintime:tdt.today,
logouttime:"",
numtime:1

})
tlogs.save()


}
else{
const tlogs = new userlogs({
userid:data1._id,
name:data1.name, 
date:tdt.todaydate,
qdate:todaydate,
ipaddress:data.ipaddress,
devicetype:data.devicetype,
logintime:tdt.today,
logouttime:"",
numtime:data5.numtime+1
})
tlogs.save()


}



}
function mydate(){

var indian_date = new Date().toLocaleString("en-Us", {timeZone: 'Asia/Kolkata'});

const today=moment(indian_date).format("DD-MM-YYYY HH:mm:ss")
const todaydate=moment(indian_date).format("DD-MM-YYYY")
console.log(todaydate)
const mydatee=new Date()
const localm = mydatee.getMonth() 
const year = mydatee.getFullYear() 
const month = localm+1
const fmonth = "0"+month

datedata={
today:today,
todaydate:todaydate,
mydatee:mydatee,
localm:localm,
year:year,
month:month,
fmonth:fmonth
}
console.log(datedata)
return datedata
}

function yearlookup(year){
myyears.findOne({year:year},(err,data)=>{
if(data){
return 0
}
else{
thisyear = new myyears({
year:year
})
thisyear.save(err=>{
if(!err){
return 1
}
})
}
})

}
app.listen(8000,() => {
    console.log("Started at port 8000")
})
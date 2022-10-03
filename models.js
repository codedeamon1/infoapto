const { number } = require("joi")
const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    leader:String,
    role:String,
    roleid:String,
    login_status:String,
    login_time:String,
    logout_time:String,
    branchid:String,
    activity:Number,
    created:String,
    modified:String,
    leadername:String,
    rolename:String,
    ipaddress:String,
    devicetype:String,
    otp:String,
    app:Number,
    teamid:String,
   
})
const appSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    dl:String,
    cm:String,
    role:String,
    scm:String,
    path:String,
    location:String,
    ip:String
})
const pathschema = new mongoose.Schema({
    userid: String,
    path:String
   
})
const loginsSchema = new mongoose.Schema({
    name: String,
    userid: String,
    logintime:String,
    logouttime:String,
    date:String,
    qdate:String,
    ipaddress:String,
    devicetype:Object,
    numtime:Number,
})
const replaceschema = new mongoose.Schema({
    userid:String,
    oldfile:String,
    Newfile:String,
    fileid:String
})
const userviewschema = new mongoose.Schema({
    userid: String,
   viewed:Number,
   fileid:String,
   branchid:String
})
const yearsschema = new mongoose.Schema({
    year:String
})

const commentschema = new mongoose.Schema({
    userid: String, 
    name: String,
    num:Number,
    interested:String,
    cname:String,
    namejob:String,
    jobid:Number,
    status:String,
    mobile:Number,
    revenue:Number,
    ctc:Number,
    billing:Number,
    modified:String,
    offerdate:String,
    compname:String,
    joindate:String,
    date:String,
    branchid:String,
    invoice:String,
    fileid:String
    
}) 

const targetschema = new mongoose.Schema({
    id:String,
    user_id: String,
    name:String,
    year:String,
    Qtarget:Number,
    Q:Number,
    m1:Number,
    m2:Number,
    m3:Number,
    m1total:Number,
    m2total:Number,m3total:Number,
    compleation:Number,
    perc:Number,
    branchid:String
})


const branchschema = new mongoose.Schema({
    username:String,
    password:String,
    cname:String,
    mobile:String,
    search:String
})

const statusschema = new mongoose.Schema({
userid:String,
cid:String,
stc:Number,
FP:Number,
IS:Number,
INS:Number,
IC:Number,
FIC:Number,
DC:Number,
OFF:Number,
YTJ:Number,
OD:Number,
OG:Number,
NJ:Number,
J:Number,
JRED:Number,
CTC:Number,
YTJR:Number,
JR:Number,
NJR:Number  ,
date:String
})
const clientschema = new mongoose.Schema({
    cname:String,
    manager:Object,
    country:String,
    city:String,
    head_designation:String,
    head_name:String,
    head_contact_no:String,
    head_mail:String,
    recruiters:Array,
    payments:Array,
    branchid:String
 })

const jobsschema = new mongoose.Schema({
  userid:String,
  uname:String,
  recruiter_name:Array,
  jobid:String,
  jobtitle:String,
  jobrole:String,
  jobloc:String,
  jobgist:String,
  cname:String,
  cid:String,
  totalexp:Number,
  releventexp:Number,
  filename:String,
  teamid:Array,
  othersid:Array,
  date:String,
  compname:String,
  branchid:String,
  qdate:String
})
const monthstatusschema = new mongoose.Schema({
    userid:String,
    cid:String,
    stc:Number,
    FP:Number,
    IS:Number,
    INS:Number,
    IC:Number,
    FIC:Number,
    DC:Number,
    OFF:Number,
    YTJ:Number,
    OD:Number,
    OG:Number,
    NJ:Number,
    J:Number,
    JRED:Number,
    CTC:Number,
    YTJR:Number,
    JR:Number,
    NJR:Number  ,
    month:String
    })
    
const uploadschema = new mongoose.Schema({
    userid: String,
    date:String,
    file: String,
    time:String
   
})  
const teamschema = new mongoose.Schema({
    name: String,
    teamnum: Number,
    
   
})


const roleschema = new mongoose.Schema({
    rolename: String,
    role:Number,
    AA:Number,
    cj:Number,
    vj:Number,
    st:Number,
    branchid:String
   
}) 
const docxschema = new mongoose.Schema({
    filename: String,
    viewed:Number,
   
}) 

const accessschema = new mongoose.Schema({
    day: String,
    fromtime:String,
    totime:String,
    branchid:String
   
}) 

const profileschema = new mongoose.Schema({
    filename: String,
    designation:Array,
    role:Array,
    secondary_skills:Array,
    primary_skills:Array,
    industry:String,
    viewed:Number
   
}) 
const timeschema = new mongoose.Schema({
    userid: String,   
    date:String,
    atime:String,
    itime:String,
    itime1:String,
    timespent:String
   
}) 

const detailschema = new mongoose.Schema({
    
    time:Number
   
}) 
const apploginschema = new mongoose.Schema({
    userid:String,
    date:String,
    atime:String,
    btime:String,
    errss:String
   
}) 
const searchschema = new mongoose.Schema({
    industry:String,
    designation:Object,
    role:Object,
    primary_skills:Object,
    secondary_skills:Object
   
})

const User = new mongoose.model("userlogins", userSchema)
const comments = new mongoose.model("comments", commentschema)
const target = new mongoose.model("usertargets", targetschema)
const branchs = new mongoose.model("branches", branchschema)
const cstatus = new mongoose.model("cstatuses", statusschema)
const client = new mongoose.model("client", clientschema)
const jobs = new mongoose.model("jobs", jobsschema)
const mstatus = new mongoose.model("mstatus", monthstatusschema)

const files =  new mongoose.model("upload", uploadschema)
const roles =  new mongoose.model("roles", roleschema) 

const docx =  new mongoose.model("filenames", docxschema)
const userview =  new mongoose.model("userviews", userviewschema)
const access =  new mongoose.model("accesstime", accessschema)
const userlogs =  new mongoose.model("userlogs", loginsSchema)
const teams =  new mongoose.model("teams", teamschema)
const profile =  new mongoose.model("profile", profileschema)


const userpath =  new mongoose.model("userpath", pathschema)
const breaks =  new mongoose.model("userbreak", timeschema)
const mytime =  new mongoose.model("timedetails", detailschema)
const elogs =  new mongoose.model("elogs", appSchema)
const logs = new mongoose.model("logs",apploginschema)
const indexes= new mongoose.model("searches",searchschema)
const myyears= new mongoose.model("myyears",yearsschema)



module.exports = { User,comments,target,branchs,cstatus,client,jobs,mstatus,files,roles,docx,access,userlogs,teams,profile,userview,userpath,breaks,mytime,elogs,logs,indexes,myyears}
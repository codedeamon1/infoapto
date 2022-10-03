const express = require("express")
const app = express();
app.post("/addclient",(req, res)=> {
    client.findOne({cname:req.body.cname},(err,data)=>{
    if(data){
        res.send({message:"already registered",cname:req.body.cname})
    
    }
    
    else{
        if (req.session.user.role == "1"){
        const data1 =new client({
            cname:req.body.cname,
            cmnager:req.body.cmanager,
            country:req.body.country,
            hname:req.body.hname,
            hdesi:req.body.hdesi,
            hmail:req.body.hmail,
            hphno:req.body.hphno,
            orgrec:req.body.orgrec,
            clientpayment:req.body.clientpayment,
            branchid:req.session.user.branchid
        })
        data1.save(err => {
            if(err) {
                res.send(err,"unable to upload")
            } else {
                res.send( { message: "Successfully Added" })
            }
    })
    }
    else{
        res.send({message:"your are not the admin"})
    }
    }
    })
    
    })
app.put("/editclient",(req, res)=> {
        client.findOneAndUpdate({cname:req.body.oldname},req.body,(err,data)=>{
          if(!err){
              res.send({message:"data saved successfully"})
          }
          else{
              res.send({message:"unable to save"})
          }
      
      })
      
      }) 
app.get("/viewclient",(req, res)=> {
          client.find({},(err,data)=>{ 
            if(!err){
                if(data){
                    console.log(data);
                    res.send({message:"datafound",data:data})
                }
                else{
                    res.send({message:"data not foundfor your branch"})
                }
            }
            else{
                res.send({message:"unable to find please try later"})
            }
        
        })
        
        })
module.exports 
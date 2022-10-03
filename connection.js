
const mongoose = require("mongoose")
require("dotenv").config();
module.exports = () => {mongoose.connect(process.env.MYDBS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err) => {
if(err){console.log(err);}
else{
    console.log("DB connected")
    }
}) 
}
 
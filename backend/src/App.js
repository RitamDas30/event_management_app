import express from 'express'
const app = express()

const port = process.env.PORT || 3000
app.listen(port , (err)=>{
    if(!err){
        console.log(`App is running on ${port}`)
    }
})

app.get('/', (req, res)=>{
    res.send("<h1>App Is Running </h1>")
})

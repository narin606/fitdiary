import http from "node:http";
let count=0, mode="success";
const analysis={description:"Mock meal",confidence:"medium",calorieRange:{min:100,max:200},items:[{name:"Mock food",portion:"one",calories:150,proteinG:5,carbsG:20,fatG:4}]};
http.createServer(async(req,res)=>{
  if(req.url==="/count"){res.setHeader("content-type","application/json");return res.end(JSON.stringify({count}));}
  if(req.url?.startsWith("/mode/")){mode=req.url.slice(6);res.statusCode=204;return res.end();}
  if(req.url!=="/v1/chat/completions"||req.method!=="POST"){res.statusCode=404;return res.end();}
  count++;
  let body="";for await(const chunk of req)body+=chunk;
  const parsed=JSON.parse(body);const url=parsed.messages?.[1]?.content?.[1]?.image_url?.url;
  if(typeof url!=="string"||!url.startsWith("data:image/jpeg;base64,")){res.statusCode=400;return res.end("private bytes required");}
  if(mode==="failure"){res.statusCode=500;return res.end("failed");}
  res.setHeader("content-type","application/json");
  res.end(JSON.stringify({choices:[{message:{content:mode==="malformed"?"not json":JSON.stringify(analysis)}}]}));
}).listen(Number(process.env.PORT),"127.0.0.1");

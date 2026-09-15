import assert from "node:assert/strict";
import test from "node:test";
import { analyzePhoto, AnalysisProviderError, parseProviderResponse, SlidingWindowLimiter } from "./analysisService.js";

const analysis={description:"Oats",confidence:"medium",calorieRange:{min:200,max:300},items:[{name:"oats",portion:"1 bowl",calories:250,proteinG:8,carbsG:40,fatG:6}]};
const envelope=(value:unknown)=>({choices:[{message:{content:JSON.stringify(value)}}]});

test("provider response is strictly validated",()=>{
  assert.deepEqual(parseProviderResponse(envelope(analysis)),analysis);
  for(const invalid of [{...analysis,confidence:"certain"},{...analysis,calorieRange:{min:2,max:1}},{...analysis,items:[{...analysis.items[0],calories:-1}]},{...analysis,extra:true}])
    assert.throws(()=>parseProviderResponse(envelope(invalid)),AnalysisProviderError);
  assert.throws(()=>parseProviderResponse({choices:[{message:{content:"not json"}}]}),AnalysisProviderError);
});

test("photo bytes are sent inline and provider failures are controlled",async()=>{
  let requestBody:any;
  const result=await analyzePhoto({baseUrl:"https://ai.example/v1/",apiKey:"secret",model:"vision",image:Buffer.from([1,2,3]),contentType:"image/png",timeoutMs:100,fetchImpl:async(_url,init)=>{requestBody=JSON.parse(String(init?.body));return new Response(JSON.stringify(envelope(analysis)),{status:200,headers:{"content-type":"application/json"}})}});
  assert.deepEqual(result,analysis);
  assert.equal(requestBody.messages[1].content[1].image_url.url,"data:image/png;base64,AQID");
  assert.equal(JSON.stringify(requestBody).includes("/diary/"),false,"no private backend URL is exposed");
  await assert.rejects(analyzePhoto({baseUrl:"https://ai.example",apiKey:"x",model:"x",image:Buffer.alloc(0),contentType:"image/jpeg",timeoutMs:100,fetchImpl:async()=>new Response("bad",{status:500})}),/provider request failed/);
});

test("provider timeout is bounded",async()=>{
  await assert.rejects(analyzePhoto({baseUrl:"https://ai.example",apiKey:"x",model:"x",image:Buffer.alloc(0),contentType:"image/jpeg",timeoutMs:5,fetchImpl:async(_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener("abort",()=>reject(new DOMException("aborted","AbortError"))) )}), (error:any)=>error.kind==="timeout");
});

test("sliding window limiter rejects excess requests",()=>{
  const limiter=new SlidingWindowLimiter(2,1000);
  assert.equal(limiter.take("u",1000),true);assert.equal(limiter.take("u",1001),true);assert.equal(limiter.take("u",1002),false);assert.equal(limiter.take("u",2001),true);assert.equal(limiter.take("other",1002),true);
});

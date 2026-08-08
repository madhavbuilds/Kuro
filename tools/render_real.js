'use strict';
const fs=require('fs'), path=require('path');
const {Ctx}=require('./canvas'); const {encodePNG}=require('./png');
const CatDraw=require('../renderer/catdraw');
const W=300,H=340;
const settings={baseColor:'#2d2a30',patternColor:'#4c4753',bellyColor:'#efe9e0',pattern:'solid',scale:1.0};
function bgctx(rgb){const c=new Ctx(W,H);for(let i=0;i<W*H;i++){c.buf[i*4]=rgb[0];c.buf[i*4+1]=rgb[1];c.buf[i*4+2]=rgb[2];c.buf[i*4+3]=255;}return c;}
const scenes=[
 ['real_idle',{face:'open',gaze:{x:0.3,y:0.2},showKeys:false,tailSway:0.5},[70,120,90]],
 ['real_type',{face:'open',gaze:{x:0,y:0.6},showKeys:true,pawPhase:0.5},[240,240,238]],
];
for(const [name,st,bg] of scenes){const c=bgctx(bg);CatDraw.draw(c,{W,H},st,settings);fs.writeFileSync(path.join(__dirname,'..','preview',name+'.png'),encodePNG(W,H,c.buf));}
console.log('real ok');

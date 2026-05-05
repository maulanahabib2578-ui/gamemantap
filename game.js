const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const minimap = document.getElementById("minimap");
const mctx = minimap.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const mapSize = 2000;

// PLAYER
let player = { x:1000, y:1000, hp:100, angle:0 };

// SENJATA
const weapons = {
  pistol:{speed:8,dmg:15},
  shotgun:{speed:6,dmg:10,spread:0.3},
  sniper:{speed:12,dmg:40}
};

player.weapon = "pistol";

// GAMBAR
let playerImg = new Image();
playerImg.src = "amba.png";

let enemyImgs = [];
["musuh1.png","musuh.png"].forEach(src=>{
  let img = new Image();
  img.src = src;
  enemyImgs.push(img);
});

// AUDIO
let shootSound = new Audio("sound.mp3");
let hitSound = new Audio("soun.mp3");

// DATA
let bullets = [];
let enemies = [];
let buildings = [
  {x:300,y:300,w:200,h:200},
  {x:900,y:600,w:250,h:200}
];

// SPAWN
for(let i=0;i<5;i++){
  enemies.push({
    x:Math.random()*mapSize,
    y:Math.random()*mapSize,
    hp:100,
    img: enemyImgs[Math.floor(Math.random()*enemyImgs.length)]
  });
}

// JOYSTICK
let joy = document.getElementById("joyStick");
let base = document.getElementById("joyBase");
let joyX=0, joyY=0, active=false;

base.addEventListener("touchstart",()=>active=true);

window.addEventListener("touchmove",e=>{
  let t=e.touches[0];

  if(active){
    let r=base.getBoundingClientRect();
    joyX=t.clientX-(r.left+60);
    joyY=t.clientY-(r.top+60);
    joy.style.left=(30+joyX)+"px";
    joy.style.top=(30+joyY)+"px";
  }

  let dx=t.clientX-canvas.width/2;
  let dy=t.clientY-canvas.height/2;
  player.angle=Math.atan2(dy,dx);
});

window.addEventListener("touchend",()=>{
  active=false;
  joy.style.left="30px";
  joy.style.top="30px";
  joyX=joyY=0;
});

// SHOOT
canvas.addEventListener("touchstart",e=>{
  let t=e.touches[0];
  if(t.clientX>canvas.width/2) shoot();
});

function shoot(){
  let w=weapons[player.weapon];

  if(player.weapon==="shotgun"){
    for(let i=-0.2;i<=0.2;i+=0.2){
      createBullet(player.angle+i,w);
    }
  } else {
    createBullet(player.angle,w);
  }

  shootSound.currentTime=0;
  shootSound.play();
}

function createBullet(angle,w){
  bullets.push({
    x:player.x,
    y:player.y,
    dx:Math.cos(angle)*w.speed,
    dy:Math.sin(angle)*w.speed,
    dmg:w.dmg
  });
}

// SWITCH SENJATA
window.addEventListener("click",()=>{
  if(player.weapon==="pistol") player.weapon="shotgun";
  else if(player.weapon==="shotgun") player.weapon="sniper";
  else player.weapon="pistol";
});

// COLLISION
function collide(px,py,size,o){
  return px<o.x+o.w && px+size>o.x && py<o.y+o.h && py+size>o.y;
}

// UPDATE
function update(){

  let nextX=player.x+joyX*0.1;
  let nextY=player.y+joyY*0.1;

  let blocked=false;
  buildings.forEach(b=>{
    if(collide(nextX,nextY,20,b)) blocked=true;
  });

  if(!blocked){
    player.x=nextX;
    player.y=nextY;
  }

  bullets.forEach(b=>{
    b.x+=b.dx;
    b.y+=b.dy;
  });

  enemies.forEach(e=>{
    let dx=player.x-e.x;
    let dy=player.y-e.y;
    let dist=Math.sqrt(dx*dx+dy*dy);
    e.x+=dx/dist;
    e.y+=dy/dist;

    if(Math.abs(e.x-player.x)<20) player.hp-=0.2;

    bullets.forEach(b=>{
      if(Math.abs(b.x-e.x)<10 && Math.abs(b.y-e.y)<10){
        e.hp-=b.dmg;
        hitSound.currentTime=0;
        hitSound.play();
      }
    });
  });

  enemies=enemies.filter(e=>e.hp>0);

  // UI
  document.getElementById("hpFill").style.width=player.hp+"%";
  document.getElementById("weaponText").innerText=player.weapon;

  // END
  if(player.hp<=0) document.getElementById("endText").innerText="GAME OVER";
  if(enemies.length===0) document.getElementById("endText").innerText="YOU WIN";
}

// DRAW
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  let camX=player.x-canvas.width/2;
  let camY=player.y-canvas.height/2;

  // MAP
  ctx.fillStyle="#2ecc71";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // BUILDING
  ctx.fillStyle="#555";
  buildings.forEach(b=>{
    ctx.fillRect(b.x-camX,b.y-camY,b.w,b.h);
  });

  // PLAYER
  ctx.save();
  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.rotate(player.angle);
  ctx.drawImage(playerImg,-20,-20,40,40);
  ctx.restore();

  // CROSSHAIR
  ctx.strokeStyle="white";
  ctx.beginPath();
  ctx.arc(canvas.width/2,canvas.height/2,10,0,Math.PI*2);
  ctx.stroke();

  // ENEMY
  enemies.forEach(e=>{
    ctx.drawImage(e.img,e.x-camX-20,e.y-camY-20,40,40);
  });

  // BULLET
  ctx.fillStyle="yellow";
  bullets.forEach(b=>{
    ctx.fillRect(b.x-camX,b.y-camY,5,5);
  });

  drawMinimap();
}

// MINIMAP
function drawMinimap(){
  mctx.clearRect(0,0,120,120);
  let scale=120/mapSize;

  mctx.fillStyle="lime";
  mctx.fillRect(player.x*scale,player.y*scale,4,4);

  mctx.fillStyle="red";
  enemies.forEach(e=>{
    mctx.fillRect(e.x*scale,e.y*scale,3,3);
  });
}

// LOOP
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
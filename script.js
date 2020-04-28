var Engine = Matter.Engine,
	Render = Matter.Render,
	World = Matter.World,
	Bodies = Matter.Bodies,
	Composite = Matter.Composite,
	Body = Matter.Body;
	Constraint = Matter.Constraint;
var engine = Engine.create();
var world = engine.world;
var bodies,canvas,door,objs=[],pickups=[],players=[],others=[];

function resetMap(x=0,y=0,pwr=-1){
	objs=[],others=[];
	engine = Engine.create();
	world = engine.world;
	for(let p of players){
		p.setRespawnPoint({ x: x, y: y });
		p.setPos({ x: x, y: y });
		p.setPowerup(pwr);
	}
}

function Player(x,y,control="default",power=-1){
	this.power=power;
	this.active=false;
	let h=false;
	this.respawnPoint={x:x,y:y};
	this.f={x:0.0025,y:0.1};
	this.canJump=true;
	this.colors=["#2e2b44","#1a1a1a","#c5c5c5","#1d9cfe","#480000","#d70a00"];
	players.push(this);
	if(control==="default"){
		this.control=[UP_ARROW,DOWN_ARROW,LEFT_ARROW,RIGHT_ARROW,222,186];
	} else {
		let ctrlbtn=control.split("");
		let temp=[];
		for(let c of ctrlbtn) temp.push(parseInt(c.toUpperCase().charCodeAt(0)));
		this.control=[...temp];
	}
	this.body = Bodies.rectangle(x, y, 50, 50, {
		friction: 0.0001,
		restitution: 0,
		inertia: Infinity,
		label: "Player"+players.indexOf(this)+"Body",
		collisionFilter: { mask: 0x0001 },
	});
	this.sensor = Bodies.rectangle(x, y, 48, 4, {isSensor:true, inertia:Infinity, label:"NoRender", mass:0});
	this.c1 = Constraint.create({
		bodyA:this.body,
		bodyB:this.sensor,
		pointA:{x: 0, y: 25},
		length: 0,
		damping:1,
		stiffness:1
	});
	World.add(world, this.body);
	World.add(world, this.sensor);
	World.add(world, this.c1);
	let variable=0;
	let lock=false;
	let t=0;
	this.p=0;
	this.setPos=function(pos,resetAll=true){
		let initVel;
		let x=pos.x,y=pos.y;
		if(resetAll) this.active=false,variable=0; else initVel=this.body.velocity;
		World.remove(world, this.body);
		World.remove(world, this.sensor);
		World.remove(world, this.c1);
		this.body = Bodies.rectangle(x, y, 50, 50, {
			friction: 0.0001,
			restitution: 0,
			inertia: Infinity,
			label: "Player"+players.indexOf(this)+"Body",
			collisionFilter: { mask: 0x0001 },
		});
		this.sensor = Bodies.rectangle(x, y, 48, 4, {isSensor:true, inertia:Infinity, label:"NoRender", mass:0});
		this.c1 = Constraint.create({
			bodyA:this.body,
			bodyB:this.sensor,
			pointA:{x: 0, y: 25},
			length: 0,
			damping:1,
			stiffness:1
		});
		World.add(world, this.body);
		World.add(world, this.sensor);
		World.add(world, this.c1);
		Body.setVelocity(this.body,{ x:0, y:0 })
		if(!resetAll) Body.applyForce(this.body,this.body.position,initVel);
	}
	this.respawn=function(){
		players.length>1? this.setPos(this.respawnPoint,true) : level.reload();
	};
	this.changeCtrl=function(control){
		if(control==="default"){
			this.control=[UP_ARROW,DOWN_ARROW,LEFT_ARROW,RIGHT_ARROW,222,186];
		} else {
			let ctrlbtn=control.split("");
			let temp=[];
			for(let c of ctrlbtn) temp.push(parseInt(c.toUpperCase().charCodeAt(0)));
			this.control=[...temp];
		}
	};
	this.setRespawnPoint=function(point){
		this.respawnPoint=point;
	};
	this.setPowerup=function(power){
		this.power=power;
	};
	this.logic=function(){
		this.canJump=false;
		for(let b of bodies.filter(element => element!==this.body&&element!==this.sensor&&!element.isSensor,this)) if(Matter.SAT.collides(this.sensor,b).collided) this.canJump=true;
		for(let s of objs.filter(element => element instanceof Spike)) if(Matter.SAT.collides(this.body,s.body).collided) this.respawn();
		if(keyIsDown(this.control[4])){
			if(Matter.SAT.collides(this.body,door.body.bodies[0]).collided||Matter.SAT.collides(this.body,door.body.bodies[1]).collided) level.next();
		} 
		if(keyIsDown(this.control[5])){
			if(!h){
				this.active=!this.active;
				h=true;
				switch(this.power){
					case 0:
						variable=60;
						t=60;
						// this.type=Math.round(random(0,1))+1;
						break;
					case 1:
						if(!variable){
							Body.applyForce(this.body,this.body.position,{
								x: 0,
								y: -this.f.y*this.body.gravityScale.y,
							});
						}
						variable=10;
						t=30;
						this.active=true;
						break;
					case 2:
						variable=150;
						t=150;
						break;
					case 3:
						variable=120;
						t=120;
						break;
					case 4:
						variable=30;
						t=30;
						break;
				}
			}
		}else h=false;
		 // else if(keyIsDown(this.control[5])&&!this.active){
			// if(!h){
				// this.power=(this.power+1)%5;
				// h=true;
			// }
		// } 
		if(variable<=0){
			variable=false;
			this.active=false;
		}
		this.body.render.fillStyle=this.colors[this.power+1];
		this.sensor.render.fillStyle=this.colors[this.power+1];
		if(this.active){
			switch(this.power){
				case 0:
					// if(this.type===1){
						Body.setGravityScale(this.body,{
							x: 1,
							y: 0
						});
						this.canJump=true;
						this.f={x:0.003,y:0.003};
					// }
					break;
				case 1:
					
					break;
				case 2:
					this.f.x=0.003,this.f.y=0.15;
					if(world.gravity.scale!==0){
						Body.applyForce(this.body,this.body.position,{
							x: (this.body.force.x<0? -0.005 : this.body.force.x===0? 0 : 0.005 ),
							y: -0.5*world.gravity.scale*world.gravity.y*this.body.mass,
						});
					}
					break;
				case 3:
					Body.setGravityScale(this.body,{
						x: 1,
						y: -1
					});
					this.c1.pointA={x:0,y:-25}
					this.f.x=0.003,this.f.y=-0.15;
					break;
				case 4:
					this.body.collisionFilter.mask=0x0002;
					Body.setGravityScale(this.body,{
						x: 1,
						y: 0
					});
					if(lock){
						Body.setVelocity(this.body,lock);
					} else {
						if(this.body.velocity.x!==0){
							lock={ x: keyIsDown(this.control[3])? 10 : (keyIsDown(this.control[2])? -10 : (this.body.velocity.x<0? -10 : 10 )), y: 0 };
							Body.setVelocity(this.body,lock);
						} else variable=1;
					}
					break;
			}
			variable--;
		} else {
			this.f={x:0.0025,y:0.1};
			Body.setGravityScale(this.body,{
				x: 1,
				y: 1,
			});
			if(this.box){
				objs.splice(objs.indexOf(this.box),1);
				World.remove(world,this.box.body);
				delete this.box;
			}
			this.c1.pointA={x:0,y:25};
			this.body.collisionFilter.mask=0x0001;
			lock=false;
			
		}
		if(keyIsDown(this.control[3])){
			Body.applyForce(this.body,this.body.position,{
				x: this.f.x,
				y: 0,
			});
		}
		if(keyIsDown(this.control[2])){
			Body.applyForce(this.body,this.body.position,{
				x: -this.f.x,
				y: 0,
			});
		}
		if(keyIsDown(this.control[1])){
			Body.applyForce(this.body,this.body.position,{
				x: 0,
				y: this.active&&this.power===0? this.f.y : 0.05*this.f.y,
			});
		}
		if(keyIsDown(this.control[0])&&this.canJump){
			this.canJump=false;
			Body.applyForce(this.body,this.body.position,{
				x: 0,
				y: -this.f.y,
			});
		}
		this.p=1-variable/t;
	};
}

function Wall(x,y,w=50,h=50,imp=false){
	this.body = Bodies.rectangle(x, y, w, h, {
		friction: 0.00001,
		restitution: 0,
		inertia: Infinity,
		isStatic:true,
		collisionFilter: { category: imp? 0x0003 : 0x0001 },
		render: { fillStyle:"#2e2b44" }
	});
	World.add(world, this.body);
	objs.push(this);
}

function Door(x,y){
	this.body = Composite.create({
		bodies: [
			Bodies.rectangle(x, y, 100, 100, {
				isStatic:true,
				isSensor: true,
				render: { fillStyle:"#2e2b44" }
			}),
			Bodies.circle(x, y-50, 50, {
				isStatic:true,
				isSensor: true,
				render: { fillStyle:"#2e2b44" }
			}),
		],
	});
	World.add(world, this.body);
	door=this;
}

function Spike(x,y){
	this.body = Bodies.fromVertices(x, y+10, [{x:0,y:-25},{x:-25,y:+25},{x:+25,y:+25}], {
		friction: 0.00001,
		restitution: 0,
		inertia: Infinity,
		isStatic:true,
		collisionFilter: { mask: 0x0003 },
		render: { fillStyle:"#2e2b44" }
	});
	World.add(world, this.body);
	objs.push(this);
}

function Pickup(x,y,type,singleuse=true){
	this.type=type;
	this.body = Composite.create();
	switch(this.type){
		case "coin":
			Composite.add(this.body, Bodies.rectangle(x, y, 50, 50, {
				isStatic:true,
				isSensor: true,
				collisionFilter: { mask: 0x0003 },
				render: { fillStyle:"#e5bb00" }
			}));
			break;
	}
	World.add(world, this.body);
	pickups.push(this);
}

function LevelManager(){
	this.lvln=0;
	let levels={
		t0: function(){
			resetMap();
			new Wall(0,Math.floor((1089/2)/50)*50+350,1920,1000,true);
			new Wall(0,Math.ceil((-1089/2)/50)*50-500,1920,1000,true);
			new Wall(Math.floor((1920/2)/50)*50+500,0,1000,1089+1000,true);
			new Wall(Math.ceil((-1920/2)/50)*50-500,0,1000,1089+1000,true);
			new Wall(-500,250,250,50);
			new Wall(0,200,250,50);
			new Wall(500,150,250,50);
			new Door(500,100);
			others.push({
				name: "text",
				x: 503,
				y: -100,
				s: 50,
				data: "Press \' to interact and open this door",
				color: color("#2e2b44")
			});
			others.push({
				name: "text",
				x: 0,
				y: 0,
				s: 50,
				data: "Welcom to Platformer.\nP1: Use Arrows to move",
				color: color("#2e2b44")
			});
			Engine.run(engine);
		},
		t1: function(){
			resetMap(-400,0);
			new Wall(0,Math.floor((1089/2)/50)*50+350,1920,1000,true);
			new Wall(0,Math.ceil((-1089/2)/50)*50-500,1920,1000,true);
			new Wall(Math.floor((1920/2)/50)*50+500,0,1000,1089+1000,true);
			new Wall(Math.ceil((-1920/2)/50)*50-500,0,1000,1089+1000,true);
			new Wall(-400,250,250,50);
			new Wall(400,250,250,50);
			for(let i=0; i<40; i++) new Spike((i-19.5)*50,350);
			new Door(400,175);
			others.push({
				name: "text",
				x: 0,
				y: 0,
				s: 50,
				data: "Don't touch the spikes. It hurts!",
				color: color("#2e2b44")
			});
			Engine.run(engine); 
		},
		t2: function(){
			resetMap(-750,0,2);
			new Wall(0,Math.floor((1089/2)/50)*50+350,1920,1000,true);
			new Wall(0,Math.ceil((-1089/2)/50)*50-500,1920,1000,true);
			new Wall(Math.floor((1920/2)/50)*50+500,0,1000,1089+1000,true);
			new Wall(Math.ceil((-1920/2)/50)*50-500,0,1000,1089+1000,true);
			new Wall(-750,250,250,50);
			new Wall(750,250,250,50);
			for(let i=0; i<40; i++) new Spike((i-19.5)*50,350);
			new Door(750,175);
			others.push({
				name: "text",
				x: -200,
				y: 0,
				s: 50,
				data: "That was hard, right?\nYou can toggle power-ups by pressing ;\nTry using this Speed power-ups",
				color: color("#2e2b44")
			});
			Engine.run(engine);
		},
		t3: function(){
			resetMap(-700,0);
			new Wall(0,Math.floor((1089/2)/50)*50+350,1920,1000,true);
			new Wall(0,Math.ceil((-1089/2)/50)*50-500,1920,1000,true);
			new Wall(Math.floor((1920/2)/50)*50+500,0,1000,1089+1000,true);
			new Wall(Math.ceil((-1920/2)/50)*50-500,0,1000,1089+1000,true);
			new Door(700,300);
			others.push({
				name: "text",
				x: 0,
				y: 100,
				s: 50,
				data: "Good Luck!",
				color: color("#2e2b44")
			});
			Engine.run(engine);
		},
		lvl1: function(){
			resetMap(-700,0);
			new Wall(0,Math.floor((1089/2)/50)*50+350,1920,1000,true);
			new Wall(0,Math.ceil((-1089/2)/50)*50-500,1920,1000,true);
			new Wall(Math.floor((1920/2)/50)*50+500,0,1000,1089+1000,true);
			new Wall(Math.ceil((-1920/2)/50)*50-500,0,1000,1089+1000,true);
			new Door(700,300);
			others.push({
				name: "text",
				x: 0,
				y: 100,
				s: 50,
				data: "Good Luck!",
				color: color("#2e2b44")
			});
			Engine.run(engine);
		}
	}
	this.next=function(){
		this.setLevel(this.lvln+1);
	}
	this.reload=function(){
		this.setLevel(this.lvln);
	}
	this.setLevel=function(n){
		this.lvln=n;
		levels[Object.getOwnPropertyNames(levels)[n+3]]? levels[Object.getOwnPropertyNames(levels)[n+3]]() : false;
	}
}

level=new LevelManager();

function preload(){
	font=loadFont("fonts/Pixelar.ttf");
}

function setup(){
	canvas=createCanvas(window.innerWidth,window.innerHeight,P2D);
	canvas.id="canvas";
	new Player(0,0,"default");
	level.setLevel(-3);
	console.log(Matter.Composite.allBodies(world));
	(function () {
		var blockContextMenu, myElement=canvas.elt;
			blockContextMenu = function (evt) {
			evt.preventDefault();
		};
		myElement.addEventListener('contextmenu', blockContextMenu);
	})();
}

function draw(){
	rectMode(CENTER);
	canvas.elt.style.width=window.innerWidth,canvas.elt.style.height=window.innerHeight;
	Engine.update(engine);
	bodies=Matter.Composite.allBodies(world);
	for(let p of players) p.logic();
	// player.logic();
	background(255,255,255,160);
	let ps=0,sumy=-50,sumx=0;
	for(let p of players){
		sumx+=p.body.position.x;
		sumy+=p.body.position.y;
		ps++;
	}
	sumx/=ps;
	sumy/=ps;
	push();
	// scale(1,world.gravity.y);
	// translate(0,-(-world.gravity.y+1)*1089/2)
	// sumx=player.body.position.x,sumy=player.body.position.y;
	for(let o of objs){
		let b=o.body;
		fill(color(b.render.fillStyle));
		stroke(color(b.render.fillStyle));
		// fill(0); 
		switch(b.label.slice(0,-5)){
			case "Rectangle":
				beginShape();
				for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
				endShape(CLOSE);
				break;
			case "Polygon":
				beginShape();
				for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
				endShape(CLOSE);
				break;
			case "Circle":
				let d=(b.bounds.max.x-b.bounds.min.x+b.bounds.max.y-b.bounds.min.y)/2;
				circle(b.position.x+1920/2-sumx,b.position.y+1089/2-sumy-50,d);
				break;
		}
	}
	for(let a of pickups){
		for(let b of a.bodies){
			fill(color(b.render.fillStyle));
			stroke(color(b.render.fillStyle));
			// fill(0); 
			switch(b.label.slice(0,-5)){
				case "Rectangle":
					beginShape();
					for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
					endShape(CLOSE);
					break;
				case "Polygon":
					beginShape();
					for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
					endShape(CLOSE);
					break;
				case "Circle":
					let d=(b.bounds.max.x-b.bounds.min.x+b.bounds.max.y-b.bounds.min.y)/2;
					circle(b.position.x+1920/2-sumx,b.position.y+1089/2-sumy-50,d);
					break;
			}
		}
	}
	for(let b of door.body.bodies){
		fill(color(b.render.fillStyle));
		stroke(color(b.render.fillStyle));
		// fill(0); 
		switch(b.label.slice(0,-5)){
			case "Rectangle":
				beginShape();
				for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
				endShape(CLOSE);
				break;
			case "Polygon":
				beginShape();
				for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
				endShape(CLOSE);
				break;
			case "Circle":
				let d=(b.bounds.max.x-b.bounds.min.x+b.bounds.max.y-b.bounds.min.y)/2;
				circle(b.position.x+1920/2-sumx,b.position.y+1089/2-sumy-50,d);
				break;
		}
	}
	for(let d of others){
		if(d.timer!==null&&d.timer!==undefined){
			d.timer--;
			if(d.timer<=0){
				others.splice(others.indexOf(d),1);
			}
		}
		fill(d.color);
		stroke(d.color);
		switch(d.name){
			case "circle":
				circle(d.x+1920/2-sumx,d.y+1089/2-sumy-50,d.d);
				break;
			case "rect":
				rect(d.x+1920/2-sumx,d.y+1089/2-sumy-50,d.w,d.h);
				break;
			case "text":
				textAlign(CENTER);
				textSize(d.s);
				textFont(font);
				text(d.data,d.x+1920/2-sumx,d.y+1089/2-sumy-50);
				break;
		}
		if(Array.isArray(d.trans)){
			for(let e of d.trans){
				if(typeof e === "object"&&!Array.isArray(e)){
					switch(e.type){
						case "fade":
							let rgba=d.color.toString("#rrggbbaa").slice(1).split("");
							let newa=(parseInt(rgba[6]+rgba[7],16)<e.decr? 0 : parseInt(rgba[6]+rgba[7],16)-e.decr).toString(16);
							d.color=color("#"+rgba.slice(0,-2).join("")+newa);
							break;
						case "collapse":
							switch(d.name){
								case "circle":
									d.d-=e.decr;
									break;
								case "rect":
									d.x-=e.decr;
									d.y-=e.decr;
									break;
								case "text":
									d.s-=e.decr;
									break;
							}
							break;
					}
				}
			}
		} else if(typeof d.trans === "object"){
			switch(d.trans.type){
				case "fade":
					let rgba=d.color.toString("#rrggbbaa").slice(1).split("");
					let newa=(parseInt(rgba[6]+rgba[7],16)<d.trans.decr? 0 : parseInt(rgba[6]+rgba[7],16)-d.trans.decr).toString(16);
					d.color=color("#"+rgba.slice(0,-2).join("")+newa);
					break;
				case "collapse":
					switch(d.name){
						case "circle":
							d.d-=d.trans.decr;
							break;
						case "rect":
							d.x-=d.trans.decr;
							d.y-=d.trans.decr;
							break;
						case "text":
							d.s-=d.trans.decr;
							break;
					}
					break;
			}
		}
	}
	for(let p of players){
		let b=p.body;
		let w=b.bounds.max.x-b.bounds.min.x,h=b.bounds.max.y-b.bounds.min.y;
		// if(random(10)>=9.99){
			// others.push({
				// name: "text",
				// x: b.position.x+random(-20,21)*2,
				// y: b.position.y+random(-20,21)*2,
				// s: 10,
				// data: "LOL",
				// trans: [{type: "fade", decr: 5}],
				// timer: 51,
				// color: color(0,0,0)
			// })
		// }
		if(p.active){
			let d;
			switch(p.power){
				case 0:
					// if(players[parseInt(b.label[6])].type===1){
						// others.push({
							// name: "circle",
							// x: temppoint.x-sumx+random(-20,21),
							// y: temppoint.y-sumx+random(-20,21),
							// d: 150,
							// trans: [{type: "collapse", decr: 2}],
							// timer: 75,
							// color: color(10+random(-10,11),200)
						// });
						// fill(30,10);
					// } else if(players[parseInt(b.label[6])].type===2){
						d=color(10+random(-10,11),200);
						others.push({
							name: "circle",
							x: b.position.x+random(-20,21),
							y: b.position.y+random(-20,21),
							d: 150,
							trans: [{type: "collapse", decr: 2}],
							timer: 75,
							color: d
						});
						p.body.render.fillStyle="#00000000";
						// fill(d);
					// }
					break;
				case 1:
					if(random(0,10)>8.5){
						others.push({
							name: "circle",
							x: b.position.x+random(-35,36),
							y: b.position.y+random(-35,36),
							d: 10,
							timer: 10,
							color: color(200)
						});
					}
					// fill(color(172));
					// fill(lerpColor(color(172),color(200),players[parseInt(b.label[6])].p));
					break;
				case 2:
					others.push({
						name: "circle",
						x: b.position.x,
						y: b.position.y,
						d: 50,
						trans: [{type: "fade", decr: 45},{type: "collapse", decr: 10}],
						timer: 5,
						color: color(30,157,255)
					});
					// fill(color(0,127,255));
					// fill(lerpColor(color(0,127,255),color(0,175,175),players[parseInt(b.label[6])].p));
					break;
				case 3:
					d=5+random(-4,5);
					others.push({
						name: "circle",
						x: b.position.x+random(-35,36),
						y: b.position.y+random(-35,36),
						d: d,
						trans: {type:"collapse",decr:1},
						timer: d,
						color: color(102,0,0)
					});
					// fill(102,0,0);
					// fill(color(142,37,37));
					// fill(lerpColor(color(142,37,37),color(72,0,0),players[parseInt(b.label[6])].p));
					break;
				case 4:
					d=5+random(-4,5);
					others.push({
						name: "circle",
						x: b.position.x+random(-35,36),
						y: b.position.y+random(-35,36),
						d: d,
						trans: {type:"collapse",decr:1},
						timer: d,
						color: color(255,0,0)
					});
					// fill(102,0,0);
					// fill(color(255,50,50,0));
					// fill(lerpColor(color(255,50,50,0),color(215,10,0),players[parseInt(b.label[6])].p));
					break;
			}
		}
		fill(color(b.render.fillStyle));
		stroke(color(b.render.fillStyle));
		beginShape();
		for(let v of b.vertices) vertex(v.x+1920/2-sumx, v.y+1089/2-sumy-50);
		endShape(CLOSE);
		break;
	}
	pop();
}

class System{
	static planets = [];
	static addPlanet(planet){
		this.planets.push(planet)
	}
	static getPlanets(){
		return this.planets;
	}
}

const thePlanetData = {
	Sun: `The Sun is the central star of our solar system, a massive ball of glowing gas composed primarily of hydrogen and helium. It is responsible for providing light and warmth to the planets orbiting it. The Sun's energy is produced through nuclear fusion at its core, where hydrogen atoms combine to form helium, releasing tremendous amounts of energy. This energy is essential for life on Earth. The Sun has a surface temperature of about 5,500°C (9,932°F) and a core temperature of about 15 million°C (27 million°F).
`,
	Mercury: `Mercury is the closest planet to the Sun and the smallest in the solar system. It has a rocky, cratered surface that resembles our Moon and is composed mostly of metal and silicate rock. Since it's so close to the Sun, Mercury experiences extreme temperature fluctuations, from scorching heat (about 430°C/800°F) during the day to freezing cold (-180°C/-290°F) at night. Mercury has a very thin atmosphere, making it inhospitable for life.`,
	Venus: `Venus is often called Earth's twin due to its similar size and composition, but it has a vastly different environment. Venus is covered by thick clouds of sulfuric acid and has a runaway greenhouse effect, making it the hottest planet in the solar system with surface temperatures reaching up to 465°C (869°F). Its atmosphere is composed mostly of carbon dioxide, and the surface pressure is about 90 times greater than Earth’s. Venus rotates in the opposite direction of most planets and has no moons.`,
	Earth: `Earth is the third planet from the Sun and the only known planet to support life. It has a diverse climate, liquid water, and a protective atmosphere composed of nitrogen and oxygen. Earth's surface is about 70% water, with continents made of various types of rock. The planet has a magnetosphere that shields it from harmful solar and cosmic radiation. Earth's gravity and atmosphere make it a habitable environment for a wide variety of species, including humans.`,
	Mars: `Known as the "Red Planet" due to its reddish appearance caused by iron oxide (rust) on its surface, Mars is the fourth planet from the Sun. It has a thin atmosphere composed mainly of carbon dioxide and experiences cold temperatures, with an average surface temperature of about -60°C (-80°F). Mars has the tallest volcano (Olympus Mons) and the largest canyon (Valles Marineris) in the solar system. Water-ice is present at its polar ice caps, and there is evidence that liquid water may have existed on its surface in the past.`,
	Jupiter: `Jupiter is the largest planet in the solar system, a gas giant made mostly of hydrogen and helium. Its atmosphere features swirling clouds and storms, the most famous being the Great Red Spot, a storm larger than Earth that has persisted for centuries. Jupiter has a strong magnetic field and at least 79 moons, including Ganymede, the largest moon in the solar system. It has no solid surface, with the outer layers transitioning into a dense core.`,
	Saturn: `Saturn is the second-largest planet in the solar system and is known for its iconic ring system, which is made of ice, dust, and rock. Like Jupiter, Saturn is a gas giant primarily composed of hydrogen and helium, and it has at least 83 moons, with Titan being the largest. Saturn’s atmosphere is characterized by high winds and massive storms, and the planet has a density low enough that it would float in water if there were a bathtub large enough.`,
	Uranus: `Uranus is an ice giant and the seventh planet from the Sun. It has a pale blue-green color due to methane in its atmosphere. Uranus has a unique tilt, rotating on its side, which causes extreme seasonal changes as it orbits the Sun. Its atmosphere is made up of hydrogen, helium, and methane, and it experiences the coldest temperatures in the solar system, reaching down to -224°C (-371°F). Uranus has at least 27 moons and faint rings.`,
	Neptune: `Neptune is the eighth and farthest planet from the Sun, classified as an ice giant. It has a striking blue color due to the presence of methane in its atmosphere. Neptune is known for its intense winds, which are the strongest in the solar system, reaching speeds of over 2,000 km/h (1,200 mph). The planet has a rocky core surrounded by a thick layer of icy materials (water, ammonia, methane), and it is extremely cold, with average temperatures around -214°C (-353°F). Neptune also has at least 14 moons, with Triton being the largest, and faint rings composed of dust and ice particles.`
}
class Planet{
	constructor(obj){
		this.THREE = obj.THREE;
		this.scene = obj.scene;
		this.x = obj.x;
		this.y = obj.y;
		this.z = obj.z;
		this.updateFunc = obj.updateFunc;
		this.radius = obj.radius;
		const geometry = new this.THREE.SphereGeometry( this.radius,32, 16 );
		const textureObj = {};
		if(obj.texture){
			textureObj.map = obj.texture;
		}else{
			textureObj.color = obj.color ?? 0x00ff00
		}
		const material = new this.THREE.MeshPhongMaterial( textureObj );
		//material.wireframe = true;
		this.planetObj = new this.THREE.Mesh( geometry, material );
		this.planetObj.position.x = this.x;
		this.planetObj.position.y = this.y;
		this.planetObj.position.z = this.z;
		this.planetName = obj.planetName;
		this.gravity = obj.gravity;
		this.planetObj.userData.planetInfo = obj.planetInfo;
		this.planetObj.userData.planetName = thePlanetData[obj.planetInfo] ?? obj.planetInfo;
	}
	draw(){
		this.scene.add( this.planetObj );
	}
	update(){
		this.updateFunc(this.planetObj);
	}
	applyGravity(object){
		// const spaceshipPos = new this.THREE.Vector3();
		// object.getWorldPosition(spaceshipPos);
		// const planetPos = new this.THREE.Vector3();
		// this.planetObj.getWorldPosition(planetPos);
		// const distanceTo = spaceshipPos.distanceTo(planetPos);
		// if(distanceTo < this.radius*10 && distanceTo > this.radius){
		// 	let dir = new this.THREE.Vector3();
		// 	dir.subVectors(spaceshipPos, planetPos).normalize().negate().multiplyScalar(1);
		// 	object.position.add(dir);
		// }
	}
}


class Controller{
	#controls;
	controlObj = {};
	constructor(obj){
		this.#controls = obj;
		for(const key in obj){
			this.controlObj[key] = false;
		}
		this.controlObj.released = false;
	}
	activate(){
		document.onkeydown = (e) => {
			this.controlObj.released = false;
			for(const key in this.#controls){
				if(this.#controls[key].includes(e.code)){
					this.controlObj[key] = true;
				}
			}
			
		}
		document.onkeyup = (e) => {
			for(const key in this.#controls){
				if(this.#controls[key].includes(e.code)){
					this.controlObj[key] = false;
					this.controlObj.released = true;
				}
			}
		}
	}
}

class Drive{
	#journeyStage = 0;
	#rotationMatrix;
	#targetQuaternion;
	#realTargetQuaternion;
	constructor(obj){
		this.THREE = obj.THREE;
		this.scene = obj.scene;
		this.start = obj.start;
		this.dest = obj.dest;
		this.domElem = obj.domElem;
		this.setFakeDist = 0;
	}

	startJourney(){
		const radius = this.dest.geometry.parameters.radius*8+3;
		const rot = Math.atan2(this.dest.position.x - this.start.position.x, this.dest.position.z - this.start.position.z) + Math.PI;
		
		const coords = [Math.cos(rot)*radius, Math.sin(rot)*radius];
		const destVec = new this.THREE.Vector3();
		destVec.copy(this.dest.position);
		destVec.z += coords[0];
		destVec.x += coords[1];
		this.destVec = destVec;
		this.#rotationMatrix = new this.THREE.Matrix4();
		this.#rotationMatrix.lookAt(destVec, this.start.position, this.start.up);
		this.#targetQuaternion = new this.THREE.Quaternion();
		this.#targetQuaternion.setFromRotationMatrix(this.#rotationMatrix);

		const realRotationMatrix = new this.THREE.Matrix4();
		realRotationMatrix.lookAt(this.dest.position, destVec, this.start.up);
		this.#realTargetQuaternion = new this.THREE.Quaternion();
		this.#realTargetQuaternion.setFromRotationMatrix(realRotationMatrix);
		this.journeyStage = 1;
		this.propulsion = 0;
		this.journeyDistance = 0;
		
	}

	keepGoing(){
		const dist = this.start.position.distanceTo(this.dest.position);
		const fakeDist = this.start.position.distanceTo(this.destVec);
		if(this.journeyStage == 1){
			this.domElem.innerHTML = "Orienting...";
			if(dist <= this.dest.geometry.parameters.radius){
				this.journeyStage = 4;
				this.domElem.innerHTML = "";
				return
			}else
			if(dist <= this.dest.geometry.parameters.radius*8+3){
				this.journeyStage = 3;
				return;
			} 
			if(!this.start.quaternion.equals(this.#targetQuaternion)){
					this.start.quaternion.rotateTowards(this.#targetQuaternion, 0.01)
					
			}else{
					this.#targetQuaternion.identity();
					this.journeyDistance = this.start.position.distanceTo(this.destVec);
					this.journeyStage = 2;
			}
		}
		if(this.journeyStage == 2){
			const direction = new this.THREE.Vector3();
			this.start.getWorldDirection(direction);
			this.domElem.innerHTML = fakeDist.toFixed(2) + " remaining...";
			if(fakeDist > this.journeyDistance/2){
				
				this.propulsion += 0.01;
			}else{
				if(this.propulsion > 0){
					this.propulsion -= 0.01;
				}else{
					this.propulsion = 0;
					this.setFakeDist = fakeDist;
					this.journeyStage = 3;
				}
				//this.start.position.add(direction.multiplyScalar(this.propulsion));
			}
			this.start.position.add(direction.multiplyScalar(this.propulsion));
		}

		if(this.journeyStage == 3){
			this.domElem.innerHTML = "Orienting...";
			if(!this.start.quaternion.equals(this.#realTargetQuaternion)){
					this.start.quaternion.rotateTowards(this.#realTargetQuaternion, 0.01)
			}else{
				this.journeyStage = 4;
				this.domElem.innerHTML = "";
			}
		}
	}
}

const fetchUrl = "https://corsproxy.io/?https://ssd.jpl.nasa.gov/api/horizons.api?"
		async function getCoords(spaceObj){
			const paramsObj = {
				format: 'text',
				COMMAND: spaceObj,
				OBJ_DATA: 'YES',
				MAKE_EPHEM: 'YES',
				EPHEM_TYPE: 'VECTORS',
				CENTER: '@sun',
				START_TIME: '2024-10-5',
				STOP_TIME: '2024-10-6',
				STEP_SIZE: '1d',
				VEC_TABLE: '1'
			}
			const searchParams = new URLSearchParams(paramsObj);
			let text = await fetch(fetchUrl + searchParams.toString());
			let res = await text.text();
			if(!res.toLowerCase().includes('radius') || res.toLowerCase().includes('irregular saturnian satellite')){
				return 'error';
			}
			res = res.split("\n");
			
			let coords = res[res.indexOf("$$SOE") + 2];
			const impLine = res.find(e => e.toLowerCase().includes(spaceObj.endsWith('99') ? "vol. mean radius" : "radius") || e.toLowerCase().includes("mean radius"))

			let reworked = impLine.split("= ")[1].trim();
			reworked = reworked.split(" ")[reworked.includes("<") ? 1 : 0].split("+")[0].replace("~", "");

			reworked = reworked.replace("<", "").trim();

			const radius = parseFloat(reworked);
			
			if(isNaN(radius)){
				return 'error';
			}
			coords = coords.split(/[XYZ]/);
			coords.splice(0, 1);
			coords = coords.map(cord => {
				return parseFloat(cord.replaceAll("=", "").trim());
			})

			let titleLine = res[4].split("  ").filter(e => e != '')[1].trim();
			
			return {
				x: coords[0],
				y: coords[1],
				z: coords[2],
				radius: radius,
				obj: spaceObj,
				planetInfo: titleLine
			}
				
		}



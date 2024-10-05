class System{
	static planets = [];
	static addPlanet(planet){
		this.planets.push(planet)
	}
	static getPlanets(){
		return this.planets;
	}
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
		const material = new this.THREE.MeshBasicMaterial( textureObj );
		//material.wireframe = true;
		this.planetObj = new this.THREE.Mesh( geometry, material );
		this.planetObj.position.x = this.x;
		this.planetObj.position.y = this.y;
		this.planetObj.position.z = this.z;
		this.planetName = obj.planetName;
		this.gravity = obj.gravity;
		this.planetObj.userData.planetInfo = obj.planetInfo;
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
		// if(distanceTo < this.radius+10 && distanceTo > this.radius){
		// 	let dir = new this.THREE.Vector3();
		// 	dir.subVectors(spaceshipPos, planetPos).normalize().negate().multiplyScalar(0.01);
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
		if(this.journeyStage == 1){
			if(this.start.position.distanceTo(this.dest.position) <= this.dest.geometry.parameters.radius*8+3){
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
			if(this.start.position.distanceTo(this.destVec) > this.journeyDistance/2){
				
				this.propulsion += 0.01;
			}else{
				if(this.propulsion > 0){
					this.propulsion -= 0.01;
				}else{
					this.propulsion = 0;
					this.journeyStage = 3;
				}
				//this.start.position.add(direction.multiplyScalar(this.propulsion));
			}
			this.start.position.add(direction.multiplyScalar(this.propulsion));
		}
		if(this.journeyStage == 3){
			if(!this.start.quaternion.equals(this.#realTargetQuaternion)){
					this.start.quaternion.rotateTowards(this.#realTargetQuaternion, 0.01)
			}else{
				this.journeyStage = 4;
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
				START_TIME: '2024-08-30',
				STOP_TIME: '2024-08-31',
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



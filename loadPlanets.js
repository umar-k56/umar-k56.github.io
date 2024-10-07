function loadPlanets(THREE, scene){
	let planetColors = {
			0: 0xff0000,
			1: 0xffa500,
			2: 0xffff00,
			3: 0x00ff00,
			4: 0x0000ff,
			5: 0x4b0082,
			6: 0xffffff,
			7: 0x000000
		}
		let moons = {
			0: 0,
			1: 0,
			2: 1,
			3: 2,
			4: 95,
			5: 66, 
			6: 27,
			7: 16
		}
		let planetList = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];

		planetList = planetList.map(e => {
			return new THREE.TextureLoader().load(`textures/${e}.jpg`)
		})
		let promises = [];
		promises.push(getCoords('10'));
		for(let i = 1; i <= 8; i++){
			promises.push(getCoords(i+'99'))
		}
		
		const distanceMultiplier = 0.000005;
		const radiusMultiplier = 0.0001;
		const planets = [];
		//console.log(promises);
		let today = new Date()
		let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
		function join(date, options, separator) {
		   function format(option) {
		      let formatter = new Intl.DateTimeFormat('en', option);
		      return formatter.format(date);
		   }
		   return options.map(format).join(separator);
		}
		let options = [{year: 'numeric'}, {month: '2-digit'},{day: '2-digit'},  ];
		Promise.all(promises).then(coords => {
			let val = 0;
			//console.log(coords.obj)
			for (const cord of coords){
				if(cord == 'error'){
					continue;
				}
				//console.log(cord);
				let planet = new Planet({
					THREE: THREE,
					scene: scene,
					x: cord.x*distanceMultiplier,
					y: cord.z*distanceMultiplier,
					z: cord.y*distanceMultiplier,
					radius: cord.radius*radiusMultiplier,
					updateFunc(obj){
						
					},
					gravity: 5000,
					color: 0xffffff,
					texture: planetList[val],
					planetName: cord.obj,
					planetInfo: cord.planetInfo
				});
				planet.draw();
				planets.push(planet);
				console.log(planet);
				System.addPlanet(planet);
				val += 1;
			}

			let moonPromises = [];
			for(let i = 1; i <= 8; i += 1){
				const moonCount = moons[i-1];
				for(let j = 0; j < moonCount; j++){
					if(j < 9){
						moonPromises.push(getCoords(i+'0'+(j+1)));
					
					}else{
						moonPromises.push(getCoords(i+''+(j+1)));
					}
				}
			}
			Promise.all(moonPromises).then(coords => {
				
				for (const cord of coords){
					if(cord == 'error'){
						continue;
					}
					const moonName = cord.obj;
					const planetOriginName = cord.obj[0] + '99';
					const planetObj = planets.find(e => e.planetName == planetOriginName).planetObj;
					const moon = new Planet({
						THREE: THREE,
						scene: scene,
						x: cord.x*distanceMultiplier,
						y: cord.z*distanceMultiplier,
						z: cord.y*distanceMultiplier,
						radius: cord.radius*radiusMultiplier,
						updateFunc(obj){
						
						},
						gravity: 5000,
						color: 0xffffff,
						planetName: cord.obj,
						planetInfo: cord.planetInfo
					});
					const moonObj = moon.planetObj;

					const planetVec = new THREE.Vector3();
					const moonVec = new THREE.Vector3();
					planetObj.getWorldPosition(planetVec)
					moonObj.getWorldPosition(moonVec);
					const compareVec = new THREE.Vector3();
					compareVec.subVectors(planetVec, moonVec).normalize().divideScalar(radiusMultiplier*cord.radius / planetObj.geometry.parameters.radius)	;
					moonObj.position.add(compareVec);
					moon.draw();
					System.addPlanet(moon);
				}

				fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${join(today, options, '-')}&end_date=${join(tomorrow, options, '-')}&api_key=DEMO_KEY`).then(res => res.json()).then(res => {
					console.log(res)
				    let neos = res.near_earth_objects[join(today, options, '-')];
				    let promises = []
				    for(const neo of neos){
				        promises.push(getCoords(`%27DES=${neo.id}%27`, true))
				    }
					 
				    Promise.all(promises).then(results => {
					 		let index = 0;
							
					 		for (let cord of results){
									let currNeo = neos[index]
									console.log(cord)
							 		const neo = new Planet({
										THREE: THREE,
										scene: scene,
										x: cord.x*distanceMultiplier,
										y: cord.z*distanceMultiplier,
										z: cord.y*distanceMultiplier,
										radius: cord.radius*radiusMultiplier*0.5,
										neoData: `Name: ${currNeo.name}\nId: ${currNeo.id}\nIs Hazardous: ${currNeo.is_potentially_hazardous_asteroid}\nRelative Velocity: ${parseFloat(currNeo.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2)} kph`,
								updateFunc(obj){
								
								},
								gravity: 5000,
								color: 0xffffff,
								planetName: cord.obj,
								planetInfo: currNeo.name
									})
									console.log(neo)
									neo.draw()
									System.addPlanet(neo)
								index += 1;
							}
				        const event = new CustomEvent("planetsLoaded");
						document.dispatchEvent(event);
				    })
				});
				
			
			})
		})

		
}

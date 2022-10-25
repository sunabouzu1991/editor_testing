document.addEventListener('DOMContentLoaded', function() {

	class viewport {
		constructor(elem) {
			this.elem = elem;
			this.box = elem.getBoundingClientRect();
			this.type = 'viewport';

			this.canvas = new canvas(elem, this);
			this.cursor_point = new THREE.Vector2();
			this.canvPos = new THREE.Vector2();

			//использутся для запоминания позиций курсора
			this.event_pos = {
				current: new THREE.Vector2(),
				preview: new THREE.Vector2()
			};
			this.move = false;

			//отключение вызова браузерного меню по правому клику мышкой
			this.elem.addEventListener('contextmenu', (e) => this.changeMenu(this, e));
		   	this.elem.addEventListener('mouseup', (e) => this.check(this, e));
			this.elem.addEventListener('mousedown', (e) => this.check(this, e));
			this.elem.addEventListener('mousemove', (e) => this.translate(this, e));
			this.elem.addEventListener('wheel', (e) => this.scale(this, e));
	  	}

	  	mouseUpdate(scale){
	  		//устанавливаем текущую позицию камеры 
			this.canvPos.set(this.canvas.position.x, this.canvas.position.y);
			//находим местоположение мыши в камере, делим на масштаб и вычитаем местоположение камеры
	  		this.cursor_point.copy(this.event_pos.current).//копируем позицию клика в рамках размеров камеры
	  		sub(this.canvPos).//разница между кликом и позицией камеры
	  		divideScalar(scale); // делим на масштаб сцены
	  	}

	  	changeMenu(parent, event){
	  		event.preventDefault();

	  		this.event_pos.current.set(event.layerX, event.layerY);
	  		this.mouseUpdate(this.canvas.scale);
			this.canvas.createProperties(this.cursor_point);
	  	}

		//отслеживаем нажатие мышкой
		check (parent, event) {
			switch (event.button) {
				case 0: //left
					if (event.type == 'mousedown') {
						if (event.target.uuid) {
							this.move = this.canvas.children[event.target.uuid];
							this.move.scaled = this.canvas.scale;
						}
						else {
							this.move = this.canvas;
							this.move.scaled = 1;
						}
						
						this.event_pos.preview.set(event.layerX, event.layerY);
					}
					else if (event.type == 'mouseup') this.move = false;
					break;
				case 1: //middle
					
					break;
				case 2: //right

					break;
				default:
					break;
			}
		}

		translate (parent, event) {
		 	if (this.move) {
		 		this.event_pos.current.set(event.layerX, event.layerY);
		 		this.event_pos.current.sub(parent.event_pos.preview);
		 		this.event_pos.preview.set(event.layerX, event.layerY);

		 		this.event_pos.current.divideScalar(this.move.scaled);
		 		this.move.addPosition(this.event_pos.current.x, this.event_pos.current.y);
		 	}
		}

		scale (parent, event) {
			let scale = event.deltaY > 0 ? -.05 : .05;
			this.event_pos.current.set(event.layerX, event.layerY);

			this.mouseUpdate(this.canvas.scale);

			this.canvPos.copy( 
				this.cursor_point. // текущая позиция курсора на сцене
				multiplyScalar(this.canvas.scale+(this.canvas.scale*scale)). // умножаем на нужный масштаб
				sub(this.event_pos.current). // вычитаем позицию курсора в камере
				multiplyScalar(-1) // инвертируем
			);

			this.canvas.setTransform(this.canvPos.x, this.canvPos.y, this.canvas.scale+(this.canvas.scale*scale));
		}
	}

	//создаём пространство для размещения блоков
	class canvas {
		constructor(div, parent = undefined) {
			this.position = new THREE.Vector2();
			this.scale = 1;
			this.parent = parent;
			this.type = 'canvas';
			this.children = {};

			this.div = document.createElement('div');
		    this.div.classList.add('canvas');
		    div.appendChild(this.div);
	  	}

	  	createProperties(vec2) {
	  		let uuid = THREE.MathUtils.generateUUID();
	  		if (this.children[uuid]) this.createBlock(vec2);
	  		else {
	  			this.children[uuid] = new properties(this.div, this);
	  			this.children[uuid].addPosition(vec2.x, vec2.y);
	  			this.children[uuid].uuid = uuid;
	  			this.children[uuid].div.uuid = uuid;
	  			return;
	  		};
	  	}

	  	addPosition(x, y){
	  		this.position.x += x;
			this.position.y += y;
			this.cssUpdate();
	  	}

	  	setTransform(x, y, scale){
	  		this.position.x = x;
			this.position.y = y;
			this.scale = scale;
			this.cssUpdate();
	  	}

	  	cssUpdate(){
	  		this.div.style.transform = (`matrix(${this.scale}, 0, 0, ${this.scale}, ${this.position.x}, ${this.position.y})`);
	  	}
	}

	//создаём блок настроек
	class properties {
		constructor(div, parent = undefined) {
			this.position = new THREE.Vector2();
			this.parent = parent;
			this.type = 'properties';
			this.params = {};

			this.div = document.createElement('div');
		    this.div.classList.add('properties');
		    div.appendChild(this.div);
	  	}

	  	addPosition(x, y){
	  		this.position.x += x;
			this.position.y += y;
			this.cssUpdate();
	  	}

	  	cssUpdate(){
	  		this.div.style.transform = (`matrix(1, 0, 0, 1, ${this.position.x}, ${this.position.y})`);
	  	}
	}

	new viewport(document.getElementById('viewport'));
}, false);
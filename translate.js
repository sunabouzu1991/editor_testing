document.addEventListener('DOMContentLoaded', function() {

	class Controller {
		constructor(elem) {
			this.elem = elem;
			this.box = elem.getBoundingClientRect();
			this.scene = new scene(elem);

			this.cursor_point = new THREE.Vector2();
			this.camPos = new THREE.Vector2();

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
			this.camPos.set(this.scene.matrix.elements[6], this.scene.matrix.elements[7]);
			//находим местоположение мыши в камере, делим на масштаб и вычитаем местоположение камеры
	  		this.cursor_point.copy(this.event_pos.current).//копируем позицию клика в рамках размеров камеры
	  		sub(this.camPos).//разница между кликом и позицией камеры
	  		divideScalar(scale); // делим на масштаб сцены
	  	}

	  	changeMenu(parent, event){
	  		event.preventDefault();

	  		parent.event_pos.current.set(event.layerX, event.layerY);
	  		parent.mouseUpdate(parent.scene.matrix.elements[0]);
			parent.scene.createBlock(parent.cursor_point);
	  	}

		//отслеживаем нажатие мышкой
		check (parent, event) {
			switch (event.button) {
				case 0: //left
					if (event.type == 'mousedown') {
						if (event.target.uuid) {
							parent.move = parent.scene.children[event.target.uuid];
							parent.move.scaled = this.scene.matrix.elements[0];
						}
						else {
							parent.move = parent.scene;
							parent.move.scaled = 1;
						}
						
						parent.event_pos.preview.set(event.layerX, event.layerY);
					}
					else if (event.type == 'mouseup') parent.move = false;
					break;
				case 1: //middle
					
					break;
				case 2://right

					break;
				default:
					break;
			}
		}

		translate (parent, event) {
		 	if (parent.move) {
		 		parent.event_pos.current.set(event.layerX, event.layerY);
		 		parent.event_pos.current.sub(parent.event_pos.preview);
		 		parent.event_pos.preview.set(event.layerX, event.layerY);

		 		parent.event_pos.current.divideScalar(parent.move.scaled);
		 		parent.move.addPosition(parent.event_pos.current.x, parent.event_pos.current.y);
		 	}
		}

		scale (parent, event) {
			let scale = event.deltaY > 0 ? -.05 : .05;
			parent.event_pos.current.set(event.layerX, event.layerY);

			parent.mouseUpdate(parent.scene.matrix.elements[0]);

			parent.camPos.copy( 
				parent.cursor_point. // текущая позиция курсора на сцене
				multiplyScalar(parent.scene.matrix.elements[0]+(parent.scene.matrix.elements[0]*scale)). // умножаем на нужный масштаб
				sub(parent.event_pos.current). // вычитаем позицию курсора в камере
				multiplyScalar(-1) // инвертируем
			);

			parent.scene.setTransform(parent.camPos.x, parent.camPos.y, parent.scene.matrix.elements[0]+(parent.scene.matrix.elements[0]*scale));
		}
	}

	//создаём пространство для размещения блоков
	class scene {
		constructor(div, parent = undefined) {
			this.matrix = new THREE.Matrix3();
			this.children = {};
			this.parent = parent;
			this.type = 'scene';
			this.params = {};

			this.div = document.createElement('div');
		    this.div.classList.add('scene');
		    div.appendChild(this.div);
	  	}

	  	addPosition(x, y){
	  		this.matrix.elements[6] += x;
			this.matrix.elements[7] += y;
			this.cssUpdate();
	  	}

	  	setTransform(x, y, scale){
	  		this.matrix.elements[6] = x;
			this.matrix.elements[7] = y;
			this.matrix.elements[0] = scale;
			this.matrix.elements[4] = scale;
			this.cssUpdate();
	  	}

	  	cssUpdate(){
	  		this.div.style.transform = (`matrix(${this.matrix.elements[0]}, 0, 0, ${this.matrix.elements[4]}, ${this.matrix.elements[6]}, ${this.matrix.elements[7]})`);
	  	}

	  	createBlock(vec2) {
	  		let uuid = THREE.MathUtils.generateUUID();
	  		if (this.children[uuid]) this.createBlock(vec2);
	  		else {
	  			this.children[uuid] = new block(this.div, this);
	  			this.children[uuid].addPosition(vec2.x, vec2.y);
	  			this.children[uuid].uuid = uuid;
	  			this.children[uuid].div.uuid = uuid;
	  			return;
	  		};
	  	}
	}

	//создаём блок настроек
	class block {
		constructor(div, parent = undefined) {
			this.position = new THREE.Vector2();
			this.parent = parent;
			this.type = 'block';
			this.params = {};

			this.div = document.createElement('div');
		    this.div.classList.add('node');
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

	new Controller(document.getElementById('view'));
}, false);
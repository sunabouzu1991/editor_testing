document.addEventListener('DOMContentLoaded', function() {
/*scene.THREE.matrix3.elements[].length = 9: 
	1) 6 и 7 элементы position по X, Y;
	2) 0 и 4 элементы scale по X, Y;

CSS: matrix(scaleX(), skewY(), skewX(), scaleY(), translateX(), translateY())

scene.THREE.matrix3.translate(10, 15);
scene.THREE.matrix3.scale(.5, .5);


vec2 aspect_ratio = vec2(u_resolution.x / u_resolution.y, 1); соотношение сторон (scale)
vec2 point_ndc = fragCoord.xy / u_resolution.xy;
vec2 point_cam = vec2( (2.0 * point_ndc - 1.0) * aspect_ratio);

cursor_point = new THREE.Vector2(event.layerX, event.layerY).sub(viewBoxSize);
camPoint = cursor_point.clone().multiplyScalar(-scene.THREE.matrix3.elements[0]*.2);

scene.THREE.matrix3.elements[6] += camPoint.x;
scene.THREE.matrix3.elements[7] += camPoint.y;
*/
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
	  		let uuid = generateUUID();
	  		if (this.children[uuid]) this.createUUID();
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


const _lut = [ '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff' ];
// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
function generateUUID() {
	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	const uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
			_lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
			_lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
			_lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

	// .toLowerCase() здесь сглаживает конкатенированные строки, чтобы сэкономить место в памяти кучи.
	return uuid.toLowerCase();
}
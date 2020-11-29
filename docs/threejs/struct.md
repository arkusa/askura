# 初识Threejs

## 三大组件

- 场景
- 相机
- 渲染器

### 场景

**场景**是承载`webgl`元素的地方, 元素只有通过`scene.add(el)`的方式才能够被**渲染器**渲染到`canvas`

`threejs`使用如下的API创建场景实例

```javascript
const scene = new THREE.Scene();
```

`threejs`的场景具有如下几个属性和方法(tips: 这些方法和属性并不都是`THREE.Scene.prototype`上的, 因为`THREE.Scene`继承自 `object3D`, e.g. `add`方法)

```
+------------------|----------|-------------|--------------------------------------+
| prop             | default  | type        | desc                                 |
+==================|==========|=============|======================================+
| background       | 0x000000 | THREE.Color | 场景的背景                           |
| children         | []       | Array       | 场景中添加的元素                     |
| fog              | -        | -           | 雾化效果, 暂时没用到                 |
| overrideMaterial | null     | -           | 强制所有的场景中的元素使用相同的材质 |
+------------------|----------|-------------|--------------------------------------+
| method           | default  | type        | desc                                 |
| add              | -        | Function    | 向场景中添加元素                     |
| remove           | -        | Function    | 从场景中移出元素                     |
+------------------|----------|-------------|--------------------------------------+
| todo             | -        | -           | -                                    |
+------------------|----------|-------------|--------------------------------------+
```

### 相机

相机就相当于👀 , 通过相机透视场景中的物体得到的投影最终会被渲染到`canvas`上

相机主要分为2中类型

- `perspective` 透视相机

  透视相机类似于人眼, 遵循**近大远小** 产生透视投影

  其有几个参数

  - `fov`

    视角, 类似于人眼的视野宽度(接近于180)

  - `aspect`

    物体的宽/高

  有了`aspect`和`fov`就可以计算出`y`方向上的视角

  - `near`

    近面距离

  - `far`

    远面距离

  `far` 和 `near`中间的区域就是**物体基于这个相机在当前场景中的投影**

  - `zoom(1)`

    变焦, 如果`zoom > 1` 元素被放大, 反之..

    如果`zoom < 0`那么场景会上下颠倒

  ```javascript
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far, zoom);
  ```

- `orthographic` 正交相机
  
### 渲染器

渲染器就是将通过`camera`得到的投影渲染到`scene`中

渲染器也被分为几种, 不过目前我接触到的都是`WebGlRenderer`

```javascript
const renderer = new THREE.WebGLRenderer();

renderer.render(camera, scene); // 这样投影就被渲染到了场景上
```

## 一些其他的概念

### 几何体

我们知道: 2个可以创建一条直线, 3个点可以创建一个平面.

所以如果我们要创建一个正方体, 那我们需要8个点, 12个平面(正方体的每一个面, 都是有2个三角形(3个点形成的面)组成)

```javascript
const vertices = [
  new THREE.Vector3(1, 1, 1)
  ...
]

vertices.length // 8

const faces = [
  new THREE.Face3(0, 1, 2) // 这里的参数是上面vertices中的索引
  ...
]

faces.length // 12
```

`threejs`给我们提供了一些基本的几何体的类, 所以目前在学习`threejs`中还不用自己创建几何体

### 材质

材质可以理解为铺在了几何体的上面, 就像木料一样

### 光源

### 坐标系

`threejs` 采用的是右手坐标系

## Demo

```javascript
(function() {
  const Th = THREE;

  // 创建一个场景
  const scene = new Th.Scene();
  // 设置背景色... 默认就是黑色的, 只支持THREE.Color的实例
  scene.background = new THREE.Color('black');

  // 创建一个透视图相机
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 500; // 相当于👀 距离物体有500m

  // 创建一个渲染器
  var renderer = new THREE.WebGLRenderer();

  // three提供的几何体
  const geometry = new THREE.BoxGeometry(200, 200, 200);
  // 定义一个正方体的每个面的颜色
  const faceColors = [
    'red',
    'green',
    'blue',
    'white',
    'yellow',
    'orange'
  ];

  // faces是geometry上的属性 就是我们提到的几何体的面
  // 前面说个它有12个面，每个平面由2个三角醒的面组成
  // 所以下面以 2 为 步长更新指针
  for(let i = 0, j = -1; i< geometry.faces.length;i++){
    if (i % 2 === 0) j += 1;
    geometry.faces[ i ].color = new Th.Color(faceColors[j]);
  }

  // 创建材质, 设置材质的颜色跟面的颜色相同
  const material = new THREE.MeshBasicMaterial({
    vertexColors: THREE.FaceColors
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 每次浏览器刷新 frame 前 都更新一下 渲染的内容
  function render() {
    requestAnimationFrame(render);
    mesh.rotation.x += 0.02;
    mesh.rotation.y += 0.02;
    renderer.render(scene, camera);
  }
  render();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  document.body.appendChild(renderer.domElement);
}());
```

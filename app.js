'use strict';

/**
 * billboard 예제에서 사용한 Sprite 객체를 이용해서 파사드를 만들 수 있음.
 * 
 * 파사드 기법이란, 3D 물체를 실제로 그리는 것이 아닌, 
 * 3D 물체를 렌더타겟을 이용해 텍스처로 변환한 뒤, 해당 텍스처가 적용된 Sprite 객체로, 즉 2D 평면으로 그려주는 걸 의미함.
 * 파사드(facade) 자체가 '건물의 정면'을 의미하는 단어이므로, 3D 물체 전체가 아닌 정면만 2D 평면으로 렌더링하는 거라고 보면 됨.
 * 
 * 3D 물체를 직접 렌더하는 것보다 그려야하는 삼각형의 양을 줄일 수 있기 때문에 성능 면에서 더 빠름.
 * 그래서 주로 먼 거리에서 작게 보이는 물체들을 렌더해야 할 때 자원낭비를 피할 목적으로 파사드 기법을 사용하는 경우가 많음.
 */

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 2, 5);

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 2, 0); // OrbitControls로 카메라를 움직일 때 카메라의 시선을 해당 좌표값으로 고정시킴
  // 얘내들은 뭐냐면 각각 카메라를 수직방향으로 얼만큼 돌릴 수 있는지, 그 각도값의 하한선과 상한선을 지정해 줌. minPolarAngle의 기본값은 0, maxPolarAngle의 기본값은 Math.PI(180도)임.
  // 그니까 기본값 대로면, 물체의 맨 위부터 맨 아래까지 수직방향으로 쭉 돌릴 수 있지만, 여기서는 상한선을 Math.PI / 2(90도)로 지정해놨으므로, 맨 위부터 수평선 지점까지만 수직방향으로 돌릴 수 있도록 제한함.
  // 그래서 물체들의 맨 아랫면까지는 돌려볼 수 없도록 한 것.
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.update(); // 속성값을 바꿔줬으면 업데이트를 항상 호출해줘야 함.

  // 씬을 생성함.
  const scene = new THREE.Scene();
  // 배경색을 여기서 지정하면 안되는 이유는, 원래의 씬을 렌더타겟에 렌더링할 때 잠깐 사용하고 난 후, animate 함수에서 캔버스에 반복 렌더링할 때 재사용할 것이기 때문임.
  // 우리가 렌더타겟에 먼저 렌더링하는 이유는, '투명한 배경에 나무 객체 하나의 facade만 그려진 텍스처'를 얻기 위함인데, 씬의 배경이 이미 하늘색으로 지정되어 있다면, 투명한 배경에 facade가 그려진 텍스처를 얻을 수 없기 때문이지.
  // 그래서 해당 씬을 렌더타겟에서 먼저 사용해주고 나서, animate에서 렌더링하기 전에 배경색을 지정해주면 됨.
  // scene.background = new THREE.Color('lightblue');

  // DirectionalLight(직사광)을 생성해서 씬에 추가하는 함수
  function addLight(position) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position); // 전달받은 좌표값 배열 요소들을 하나하나 복사하여 position.x, y, z에 하나씩 할당해 주도록 함.
    scene.add(light);
    scene.add(light.target); // 조명의 타겟도 씬에 따로 추가해줌. 타겟의 좌표값은 별도로 지정하지 않으면 (0, 0, 0)을 향하도록 되어있음.
  }
  addLight([-3, 1, 1]);
  addLight([2, 1, 0.5]); // 두 개의 조명을 만들어서 씬에 추가함.

  // 그리드 형태로 배치되는 모든 나무에 공통적으로 사용할 원뿔, 원통 geometry 및 머티리얼을 만듦.
  const trunkRadius = 0.2;
  const trunkHeight = 1;
  const trunkRadialSegments = 12;
  const trunkGeometry = new THREE.CylinderGeometry(
    trunkRadius, trunkRadius, trunkHeight, trunkRadialSegments
  ); // 원통 지오메트리 생성

  const topRadius = trunkRadius * 4;
  const topHeight = trunkHeight * 2;
  const topSegments = 12;
  const topGeometry = new THREE.ConeGeometry(
    topRadius, topHeight, topSegments
  ); // 원뿔 지오메트리 생성

  const trunkMaterial = new THREE.MeshPhongMaterial({
    color: 'brown'
  }); // 원통에 적용할 갈색 퐁-머티리얼 생성
  const topMaterial = new THREE.MeshPhongMaterial({
    color: 'green'
  }); // 원뿔에 적용할 초록색 퐁-머티리얼 생성

  // 나무들을 XZ축 기준으로 하는 평면에 생성하고자 x, z좌표값을 받아 나무 메쉬를 생성해서 씬에 추가하는 함수
  function makeTree(x, z) {
    const root = new THREE.Object3D(); // 줄기 메쉬와 윗부분 메쉬를 자식노드로 추가해서 같이 움직여주려고 만든 부모노드

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2; // 줄기 메쉬의 y좌표값을 줄기 높이의 절반만큼 올려줌. 아마 원통 메쉬는 기준점이 가운데이니까 저렇게 y좌표값을 지정하면 줄기 메쉬의 맨 아랫부분이 y가 0인 지점에 닿을거임. 
    root.add(trunk); // 줄기메쉬를 생성한 뒤 root 부모요소에 추가함.

    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = trunkHeight + topHeight / 2; // 윗부분 메쉬의 y좌표값을 줄기 메쉬 위쪽으로 올려줌.
    root.add(top);

    root.position.set(x, 0, z); // XZ축을 기준으로 나무들을 배치할 것이므로 y좌표값은 0으로 통일해 줌.
    scene.add(root); // 부모노드를 씬에 추가함

    return root; // 최종적으로 부모노드를 리턴해 줌.
  }

  /**
   * 직각삼각형에서 tan(angle) = 높이 / 밑변 공식을 활용해서 
   * 밑변 = 높이 / tan(angle)로 육면체가 카메라의 절두체 안으로 들어올 수 있는 육면체 ~ 카메라 사이의 거리값을 구할 수 있음.
   * 
   * 이 거리를 구할 때 나무의 bounding box의 크기(boxSize)와 중심점(boxCenter)을 넘겨줘서 구하는 함수를 만든 것.
   */
  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5; // 카메라 절두체 화면크기의 절반값. 직각삼각형에서 높이에 해당.
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5); // 현재 카메라의 시야각(fov)값의 절반값. tan() 메서드에 할당할 각도값. fov는 항상 degree 단위로 계산되기 때문에 tan 메서드에 넣어주려면 radian 단위로 변환해줘야 함.
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY); // 카메라와 육면체 사이의 거리값. 탄젠트값으로 직각삼각형의 밑변의 길이를 구하는 공식을 정리한 것.

    // 카메라의 위치를 boxCenter 지점(나무의 boundingBox의 가운데)로 옮긴 뒤, 거기에서 z방향으로 위에서 구한 distance만큼 당겨오는 식으로 카메라의 위치값을 지정해 줌.
    // 왜냐? 이전에 loading-obj, gltf 예제와는 다르게 object 즉, 나무 하나를 (0, 0) 지점에서 생성하므로, boxCenter도 원점 근처에 위치할거임.
    // 따라서 처음부터 카메라와 나무가 대체로 수평 일직선 상에 위치하기 때문에 굳이 방향벡터를 만들어서 y값을 변환해주거나 할 필요없이, 바로 boxCenter 지점에서 distance 거리만큼 z값을 당겨오기만 하면 되는 것.  
    camera.position.copy(boxCenter);
    camera.position.z += distance;

    // 카메라의 절두체 안에 나무의 bounding box가 들어가고도 남을 사이즈가 되도록 near, far값을 지정해 줌.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix(); // 카메라의 near, far값을 바꿔줬으면 업데이트 메서드를 호출해줘야 함.
  }

  // 생성한 나무 객체를 넘겨준 뒤, 나무 객체가 절두체 안에 들어올 수 있도록 카메라 절두체와 위치값을 수정하고, 렌더 타겟에 나무 객체의 파사드(facade)를 렌더한 뒤, 렌더 타겟의 텍스처를 리턴해주는 함수
  function makeSpriteTexture(textureSize, obj) {
    const rt = new THREE.WebGLRenderTarget(textureSize, textureSize); // 64로 넘겨준 textureSize값을 이용해서 64*64 사이즈의 렌더타겟을 생성함. -> 이렇게 하면 렌더타겟으로 만든 텍스처의 사이즈도 64*64 픽셀이 됨.

    const aspect = 1; // 렌더 타겟이 정사각형(64*64)이므로, 렌더타겟에 장면을 찍어서 렌더해 줄 렌더타겟용 카메라의 비율도 1, 즉 정사각형 비율로 해줌.
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far); // 나머지 값은 원래 카메라에서 쓰던 걸로, aspect값만 렌더타겟 비율에 맞게 수정한 값으로 넘겨줘서 렌더타겟용 카메라를 생성함

    scene.add(obj); // 넘겨받은 나무 객체를 임시로 씬에 추가해놓음. 원래 씬을 렌더타겟에 렌더할 때 쓰기 위해 재사용하려는 것.

    const box = new THREE.Box3().setFromObject(obj); // 인자로 전달한 나무 객체의 3D 공간상의 bounding box를 계산해 줌.
    const boxSize = box.getSize(new THREE.Vector3()); // 인자로 전달한 Vector3에 boudningBox의 width, height, depth값을 복사하여 리턴해 줌.
    const boxCenter = box.getCenter(new THREE.Vector3()); // boundingBox의 가운데 좌표값을 구해서 인자로 전달한 Vector3에 복사하여 리턴해 줌.
    // console.log(obj.position, boxCenter); // 나무객체의 position값과 boundingBox.boxCenter의 좌표값이 약간 다름. y좌표값에서 약간 차이가 있네.

    /**
     * frameArea에 넘겨 줄 size값을 계산하기 위해서
     * 1. 일단 Vector3인 boxSize의 width, height, depth값들을 Vector3.toArray()를 이용해 배열 형태로 변환하여 리턴해 줌.
     * 2. 그 배열안의 width, height, depth값들을 하나하나 복사하여 Math.max() 메서드에 할당해 줌.
     * 3. 그러면 그 세 값중에 가장 큰 값이 리턴될텐데(아마 나무 객체의 height 값이 리턴될 듯), 이 값에다가 1.1(fudge)만큼을 곱해서 frameArea에 넘겨줌.
     * 
     * 왜 fudge를 곱해주는 걸까? 
     * 예를 들어서 나무 객체의 height이 리턴된다고 가정해보면, frameArea에서는 그것의 절반만큼을 직각삼각형의 높이로 지정할거임.
     * 그럼 딱 그만큼을 기준으로 카메라의 절두체 사이즈와 카메라 위치가 계산된다고 가정할 때, 나무 객체의 bounding box의 가장자리 일부가 절두체를 벗어나게 되어버림.
     * loading-obj-2 예제에서도 정리했듯이, bounding box의 높이값을 화면 크기로 갖는 절두체가 만들어진다면, bounding box가 그 절두체에 다 들어가지 못하고 짤리는 부분이 반드시 생기게 됨.
     * 그래서 절두체가 육면체를 넉넉하게 품을 수 있을만큼의 size값을 계산해주기 위해 fudge, 즉 눈속임값을 곱해준 것임.
     */
    const fudge = 1.1;
    const size = Math.max(...boxSize.toArray()) * fudge;
    frameArea(size, size, boxCenter, camera); // 나무객체의 bounding box를 넉넉하게 포함하기 위한 렌더타겟용 카메라의 절두체 사이즈와 위치가 지정될거임. 

    renderer.autoClear = false; // 이전 결과물들을 지우지 않아도 되도록 함. 왜냐? 렌더타겟에 렌더해 줄 장면은 지금 이 함수 내에서 '딱 한 번만' 렌더할거니까. 이전 프레임 결과물을 지우고 자시고 할 것도 없고, 애니메이션을 만들 것도 없으니까.
    renderer.setRenderTarget(rt); // 렌더러의 활성 렌더 대상을 '렌더타겟'으로 지정함으로써, 이후부터 render 메서드를 호출하면 렌더타겟에 렌더해 줌.
    renderer.render(scene, camera); // 나무객체 하나가 추가된 원래 씬과 렌더타겟용 카메라를 전달해주면서 렌더타겟에 나무객체의 파사드(facaed)를 렌더해 줌.
    renderer.setRenderTarget(null); // 활성 렌더 대상을 초기값으로, 즉 원래의 캔버스로 초기화함.
    renderer.autoClear = true; // 이제 렌더러는 animate 함수에서 캔버스에다 반복적으로 렌더링해서 애니메이션을 만들어줘야 하니까, 이전 결과물들은 자동으로 지워주도록 함.

    scene.remove(obj); // 추가했던 하나의 나무객체는 이제 원래 씬에서 제거해 줌. 이후에 facade sprite 객체들과 평면메쉬 등을 새로 넣어줘서 animate 함수에서 렌더해야 하므로 씬을 비워준 것.  

    // makeSprite 함수에서 Sprite 객체를 생성할 때 사용할 값들을 묶어서 리턴해 줌. 
    return {
      offset: boxCenter.multiplyScalar(fudge), // 나무 객체의 boundingBox의 가운데 좌표값(즉, 위치값)에 fudge만큼을 각각 곱해준 값을 리턴함. 
      // 왜 곱해주냐면, 애초에 렌더타겟용 카메라 절두체 사이즈와 거리를 boundingBox height * 1.1 만큼의 사이즈로 가정하고 계산해줬으니, 나무 Sprite의 위치값을 boundingBox의 위치값으로 지정해주고 싶다면
      // 늘어난 boundingBox의 사이즈만큼을 감안한 위치값을 리턴해줘야 겠지 
      scale: size, // 나무 객체의 boundingBox 높이값에 fudge만큼 약간 늘려준 size값을 리턴함. makeSprite 함수에서 나무 Sprite의 scale값으로 사용할거임. 
      texture: rt.texture // 투명한 배경에 나무 객체 하나만 렌더된 렌더타겟의 텍스처를 리턴함. 
    }
  }

  const tree = makeTree(0, 0); // 렌더타겟에 렌더링하기 위해 사용할 나무 객체를 (0, 0, 0)지점에 만든 후 씬에 추가함.
  const facadeSize = 64; // 렌더타겟으로 만드는 텍스처의 사이즈로 지정해 줄 값
  const treeSpriteInfo = makeSpriteTexture(facadeSize, tree); // 렌더타겟에 나무객체를 렌더링한 뒤, Sprite 객체를 만드는 데 필요한 값들을 리턴받음.

  // makeSpriteTexture 함수로부터 리턴받은 값들을 이용해서 Sprite 객체를 만들고, 전달받은 x, z좌표값을 이용해서 XZ축 평면 상에 배치하는 함수
  function makeSprite(spriteInfo, x, z) {
    const {
      texture,
      offset,
      scale
    } = spriteInfo; // treeSpriteInfo에 리턴받은 값들을 각각 const texture, offset, scale에 할당해 줌.
    const mat = new THREE.SpriteMaterial({
      map: texture, // 나무 객체의 facade만 렌더링된 렌더타겟의 텍스처를 할당함.
      transparent: true // Sprite은 일반적으로 부분적으로 투명한 텍스처를 적용받기 때문에 그 텍스처가 할당되는 SpriteMaterial도 투명도 조절을 활성화 해두는 것 같음.
    }); // Sprite 객체를 만들 때 사용할 SpriteMaterial 생성
    const sprite = new THREE.Sprite(mat); // Sprite 객체 생성
    scene.add(sprite); // 생성한 Sprite 객체를 씬에 추가함
    sprite.position.set(
      offset.x + x,
      offset.y,
      offset.z + z
    ); // 생성한 Sprite 객체의 위치값을 재배치 함.
    // 기본적으로 makeTree(0, 0)으로 호출해서 생성된 나무객체는 (0, 0, 0) 지점에 생성되고, 그것의 boundingBox.boxCenter 좌표값은 (0, 1.5, 0)를 리턴받게 됨. 두 좌표값이 약간 다른거에 유의할 것!
    // 따라서 이 좌표값에 1.1을 스칼라배 해주면, 모든 Sprite들의 y좌표값은 1.65로 고정, x, z는 똑같이 0이 나오겠지?
    // 그래서 Sprite들마다 이중 for loop에서 받은 10, 10 간격의 x, z좌표값을 추가로 더해줘서 각 Sprite의 위치값이 100*100 영역에 10씩 간격을 두고 배치될 수 있도록 계산해준거임.
    sprite.scale.set(scale, scale, scale); // Sprite의 사이즈는 나무객체의 boundingBox의 높이값에 1.1만큼 곱한 값으로 지정해 줌.
  }

  // 400*400 평면 위의 100*100만큼의 영역 내에 나무들을 생성해서 배치해줄거임.
  // 이때, 100*100 영역을 400*400 평면의 가운데로 맞추고 싶기 때문에, 나무들의 x좌표값은 -50 ~ 50까지, z좌표값도 -50 ~ 50까지 각각 10씩 간격을 두고 나무를 생성하는 이중 for loop를 사용함.
  for (let z = -50; z <= 50; z += 10) {
    for (let x = -50; x <= 50; x += 10) {
      makeSprite(treeSpriteInfo, x, z);
    }
  }

  // 렌더타겟에도 렌더링을 해줬고, 나무객체도 씬에서 비워줬고, 새로 렌더링 할 Sprite 객체들도 모두 추가해줬으니 이제 배경색을 지정해줘도 될 것 같음.
  scene.background = new THREE.Color('lightblue');

  // 땅 역할을 할 400*400 사이즈의 평면 메쉬도 생성함.
  {
    const size = 400;
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshPhongMaterial({
      color: 'gray'
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI * -0.5; // 평면 메쉬는 기본적으로 XY축을 기준으로 생성되므로, 얘를 XZ축을 기준으로 생성되도록 돌리려면 x축 방향으로 -90도만큼 회전시켜 줌.
    scene.add(mesh);
  }

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // animate
  function animate() {
    // 렌더러가 리사이징 되었다면 변경된 사이즈에 맞게 카메라 비율(aspect)도 업데이트 해줌.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(animate); // 내부에서 반복 호출
  }

  requestAnimationFrame(animate);
}

main();
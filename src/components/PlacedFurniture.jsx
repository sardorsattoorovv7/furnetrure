import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const STATUS_COLOR = {
  compatible: "#2f7a52",
  warning: "#b7791f",
  incompatible: "#b23a34",
  unchecked: "#9c9282",
};

export function PlacedFurniture({ 
  item, 
  isSelected, 
  onSelect, 
  onDragStart,
  draggingId 
}) {
  // ===== KONSOLGA CHIQARISH =====
  console.log('🪑 PlacedFurniture render:', item?.name);
  console.log('📦 GLB URL:', item?.glbUrl);
  console.log('📍 Position:', item?.x, item?.y, item?.z);
  console.log('📏 Size (m):', item?.widthM, item?.heightM, item?.depthM);
  
  // GLB yuklash
  const { scene, error, progress } = useGLTF(item?.glbUrl);
  
  // ===== GLB yuklanish holatini kuzatish =====
  useEffect(() => {
    if (error) {
      console.error('❌ GLB yuklash xatosi:', error);
      console.error('❌ Xatolik URL:', item?.glbUrl);
    }
    if (scene) {
      console.log('✅ GLB yuklandi:', item?.name);
      
      // Model o'lchamlarini tekshirish
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      console.log('📐 Model original size (3D):', size.x, size.y, size.z);
    }
    if (progress !== undefined) {
      console.log('📥 Yuklanmoqda:', progress, '%');
    }
  }, [scene, error, progress, item]);

  const cloned = useMemo(() => {
    if (!scene) {
      console.warn('⚠️ Scene yo\'q, cloning qilib bo\'lmadi');
      return null;
    }
    console.log('🔄 Cloning scene...');
    return scene.clone(true);
  }, [scene]);

  const groupRef = useRef();
  const [scaleFactor, setScaleFactor] = useState(1);

  // ===== Scale factor hisoblash =====
  useEffect(() => {
    if (!cloned) {
      console.warn('⚠️ Cloned yo\'q, scale hisoblab bo\'lmadi');
      return;
    }
    
    try {
      const box = new THREE.Box3().setFromObject(cloned);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      console.log('📐 Cloned model size:', size.x, size.y, size.z);
      console.log('🎯 Target height (m):', item?.heightM);
      
      if (size.y > 0 && item?.heightM > 0) {
        const newScale = item.heightM / size.y;
        setScaleFactor(newScale);
        console.log('📏 Scale factor:', newScale);
        console.log('📏 Final size:', 
          (size.x * newScale).toFixed(3), 
          (size.y * newScale).toFixed(3), 
          (size.z * newScale).toFixed(3)
        );
      } else {
        console.warn('⚠️ Model height yoki target height 0');
        setScaleFactor(1);
      }
    } catch (err) {
      console.error('❌ Scale hisoblashda xatolik:', err);
    }
  }, [cloned, item?.heightM]);

  const outlineColor = STATUS_COLOR[item?.compatibilityStatus] || STATUS_COLOR.unchecked;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    console.log('🖱️ Click on:', item?.name, 'ID:', item?.id);
    if (onSelect) onSelect(item?.id);
    if (onDragStart) onDragStart(item?.id);
  };

  // ===== Agar model yuklanmagan bo'lsa, placeholder ko'rsatish =====
  if (!scene || !cloned) {
    console.warn('⚠️ No scene or cloned for:', item?.name);
    return (
      <mesh 
        position={[item?.x || 0, 0.5, item?.z || 0]}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" transparent opacity={0.5} />
        <meshBasicMaterial color="yellow" wireframe />
      </mesh>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[item?.x || 0, 0, item?.z || 0]}
      rotation={[0, item?.rotationY || 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
    >
      {/* 3D Model */}
      <primitive object={cloned} scale={scaleFactor} />

      {/* Footprint */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.002, 0]}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[item?.widthM || 1, item?.depthM || 1]} />
        <meshBasicMaterial
          color={outlineColor}
          transparent
          opacity={isSelected ? 0.35 : 0.18}
          depthWrite={false}
        />
      </mesh>
      
      {isSelected && <SelectionRing widthM={item?.widthM || 1} depthM={item?.depthM || 1} />}
    </group>
  );
}

function SelectionRing({ widthM, depthM }) {
  const ref = useRef();
  const radius = Math.max(widthM, depthM) * 0.75;

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
      <ringGeometry args={[radius, radius + 0.02, 32]} />
      <meshBasicMaterial color="#2f5768" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}
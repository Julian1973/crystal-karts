='cove'){const tunnel=new T.InstancedMesh(new T.TorusGeometry(10,.42,6,20,Math.PI),material(accent,true),7);for(let i=0;i<7;i++){const f=frame((.35+i*.045)*Tm);dummy.position.copy(f.p);dummy.position.y+=.1;dummy.rotation.set(0,Math.atan2(f.t.x,f.t.z)+Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();tunnel.setMatrixAt(i,dummy.matrix);}scene.add(tunnel);}
 if(track.id==='showcase'){const f=frame(.47*Tm,0);put(new T.TorusGeometry(8,.5,6,20,Math.PI),accent,f.p.clone().add(new T.Vector3(0,1,0)),[1,1,1],true);}
}

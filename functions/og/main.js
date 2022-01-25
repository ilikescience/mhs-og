(()=>{"use strict";const t=.5*(Math.sqrt(3)-1),e=(3-Math.sqrt(3))/6,o=1/6,n=(Math.sqrt(5)-1)/4,s=(5-Math.sqrt(5))/20,r=new Float32Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]),l=new Float32Array([0,1,1,1,0,1,1,-1,0,1,-1,1,0,1,-1,-1,0,-1,1,1,0,-1,1,-1,0,-1,-1,1,0,-1,-1,-1,1,0,1,1,1,0,1,-1,1,0,-1,1,1,0,-1,-1,-1,0,1,1,-1,0,1,-1,-1,0,-1,1,-1,0,-1,-1,1,1,0,1,1,1,0,-1,1,-1,0,1,1,-1,0,-1,-1,1,0,1,-1,1,0,-1,-1,-1,0,1,-1,-1,0,-1,1,1,1,0,1,1,-1,0,1,-1,1,0,1,-1,-1,0,-1,1,1,0,-1,1,-1,0,-1,-1,1,0,-1,-1,-1,0]),c=document.querySelector("canvas"),i=c.getContext("2d"),h=new class{constructor(t=Math.random){const e="function"==typeof t?t:function(t){let e=0,o=0,n=0,s=1;const r=function(){let t=4022871197;return function(e){e=e.toString();for(let o=0;o<e.length;o++){t+=e.charCodeAt(o);let n=.02519603282416938*t;t=n>>>0,n-=t,n*=t,t=n>>>0,n-=t,t+=4294967296*n}return 2.3283064365386963e-10*(t>>>0)}}();return e=r(" "),o=r(" "),n=r(" "),e-=r(t),e<0&&(e+=1),o-=r(t),o<0&&(o+=1),n-=r(t),n<0&&(n+=1),function(){const t=2091639*e+2.3283064365386963e-10*s;return e=o,o=n,n=t-(s=0|t)}}(t);this.p=function(t){const e=new Uint8Array(256);for(let t=0;t<256;t++)e[t]=t;for(let o=0;o<255;o++){const n=o+~~(t()*(256-o)),s=e[o];e[o]=e[n],e[n]=s}return e}(e),this.perm=new Uint8Array(512),this.permMod12=new Uint8Array(512);for(let t=0;t<512;t++)this.perm[t]=this.p[255&t],this.permMod12[t]=this.perm[t]%12}noise2D(o,n){const s=this.permMod12,l=this.perm;let c=0,i=0,h=0;const a=(o+n)*t,f=Math.floor(o+a),M=Math.floor(n+a),u=(f+M)*e,p=o-(f-u),d=n-(M-u);let m,y;p>d?(m=1,y=0):(m=0,y=1);const w=p-m+e,b=d-y+e,g=p-1+2*e,D=d-1+2*e,q=255&f,A=255&M;let P=.5-p*p-d*d;if(P>=0){const t=3*s[q+l[A]];P*=P,c=P*P*(r[t]*p+r[t+1]*d)}let I=.5-w*w-b*b;if(I>=0){const t=3*s[q+m+l[A+y]];I*=I,i=I*I*(r[t]*w+r[t+1]*b)}let v=.5-g*g-D*D;if(v>=0){const t=3*s[q+1+l[A+1]];v*=v,h=v*v*(r[t]*g+r[t+1]*D)}return 70*(c+i+h)}noise3D(t,e,n){const s=this.permMod12,l=this.perm;let c,i,h,a;const f=.3333333333333333*(t+e+n),M=Math.floor(t+f),u=Math.floor(e+f),p=Math.floor(n+f),d=(M+u+p)*o,m=t-(M-d),y=e-(u-d),w=n-(p-d);let b,g,D,q,A,P;m>=y?y>=w?(b=1,g=0,D=0,q=1,A=1,P=0):m>=w?(b=1,g=0,D=0,q=1,A=0,P=1):(b=0,g=0,D=1,q=1,A=0,P=1):y<w?(b=0,g=0,D=1,q=0,A=1,P=1):m<w?(b=0,g=1,D=0,q=0,A=1,P=1):(b=0,g=1,D=0,q=1,A=1,P=0);const I=m-b+o,v=y-g+o,k=w-D+o,x=m-q+2*o,C=y-A+2*o,F=w-P+2*o,S=m-1+.5,T=y-1+.5,U=w-1+.5,O=255&M,E=255&u,W=255&p;let j=.6-m*m-y*y-w*w;if(j<0)c=0;else{const t=3*s[O+l[E+l[W]]];j*=j,c=j*j*(r[t]*m+r[t+1]*y+r[t+2]*w)}let z=.6-I*I-v*v-k*k;if(z<0)i=0;else{const t=3*s[O+b+l[E+g+l[W+D]]];z*=z,i=z*z*(r[t]*I+r[t+1]*v+r[t+2]*k)}let B=.6-x*x-C*C-F*F;if(B<0)h=0;else{const t=3*s[O+q+l[E+A+l[W+P]]];B*=B,h=B*B*(r[t]*x+r[t+1]*C+r[t+2]*F)}let G=.6-S*S-T*T-U*U;if(G<0)a=0;else{const t=3*s[O+1+l[E+1+l[W+1]]];G*=G,a=G*G*(r[t]*S+r[t+1]*T+r[t+2]*U)}return 32*(c+i+h+a)}noise4D(t,e,o,r){const c=this.perm;let i,h,a,f,M;const u=(t+e+o+r)*n,p=Math.floor(t+u),d=Math.floor(e+u),m=Math.floor(o+u),y=Math.floor(r+u),w=(p+d+m+y)*s,b=t-(p-w),g=e-(d-w),D=o-(m-w),q=r-(y-w);let A=0,P=0,I=0,v=0;b>g?A++:P++,b>D?A++:I++,b>q?A++:v++,g>D?P++:I++,g>q?P++:v++,D>q?I++:v++;const k=A>=3?1:0,x=P>=3?1:0,C=I>=3?1:0,F=v>=3?1:0,S=A>=2?1:0,T=P>=2?1:0,U=I>=2?1:0,O=v>=2?1:0,E=A>=1?1:0,W=P>=1?1:0,j=I>=1?1:0,z=v>=1?1:0,B=b-k+s,G=g-x+s,H=D-C+s,J=q-F+s,K=b-S+2*s,L=g-T+2*s,N=D-U+2*s,Q=q-O+2*s,R=b-E+3*s,V=g-W+3*s,X=D-j+3*s,Y=q-z+3*s,Z=b-1+4*s,$=g-1+4*s,_=D-1+4*s,tt=q-1+4*s,et=255&p,ot=255&d,nt=255&m,st=255&y;let rt=.6-b*b-g*g-D*D-q*q;if(rt<0)i=0;else{const t=c[et+c[ot+c[nt+c[st]]]]%32*4;rt*=rt,i=rt*rt*(l[t]*b+l[t+1]*g+l[t+2]*D+l[t+3]*q)}let lt=.6-B*B-G*G-H*H-J*J;if(lt<0)h=0;else{const t=c[et+k+c[ot+x+c[nt+C+c[st+F]]]]%32*4;lt*=lt,h=lt*lt*(l[t]*B+l[t+1]*G+l[t+2]*H+l[t+3]*J)}let ct=.6-K*K-L*L-N*N-Q*Q;if(ct<0)a=0;else{const t=c[et+S+c[ot+T+c[nt+U+c[st+O]]]]%32*4;ct*=ct,a=ct*ct*(l[t]*K+l[t+1]*L+l[t+2]*N+l[t+3]*Q)}let it=.6-R*R-V*V-X*X-Y*Y;if(it<0)f=0;else{const t=c[et+E+c[ot+W+c[nt+j+c[st+z]]]]%32*4;it*=it,f=it*it*(l[t]*R+l[t+1]*V+l[t+2]*X+l[t+3]*Y)}let ht=.6-Z*Z-$*$-_*_-tt*tt;if(ht<0)M=0;else{const t=c[et+1+c[ot+1+c[nt+1+c[st+1]]]]%32*4;ht*=ht,M=ht*ht*(l[t]*Z+l[t+1]*$+l[t+2]*_+l[t+3]*tt)}return 27*(i+h+a+f+M)}}("{headline}"),a=1200,f=.5,M=["#4b3d3a","#2d4771","#3b6db6","#4688e7","#4095df","#319bbc","#19a290","#84b88d","#c6cf96","#f7e49e","#fac78f","#f79c7a","#f46161","#DFD7C7"],u=4/Math.sqrt(2),p=Math.ceil(a/u),d=Math.ceil(675/u),m=[...new Array(p*d)].map((()=>[]));let y=1;const w=[],b=()=>(h.noise2D(0,y++)+1)/2,g=([t,e],[o,n])=>Math.sqrt(Math.pow(t-o,2)+Math.pow(e-n,2)),D=([t,e],o=!0)=>{const n=h.noise2D(t/a*f,e/675*f)*Math.PI,s=(h.noise3D(t/a*f,e/675*f,n/(2*Math.PI))+1)*u;return o?q(n,s):[n,s]},q=(t,e)=>[Math.cos(t)*e,Math.sin(t)*e],A=([t,e])=>t+e*p,P=([t,e])=>[Math.floor(t/u),Math.floor(e/u)],I=t=>{const[e,o]=P(t);return A([e,o])},v=(t,e=!1)=>{const o=(t=>{const[e,o]=P(t),n=[];for(let t=-1;t<=1;t++)for(let s=-1;s<=1;s++)if(e+t>=0&&e+t<=p&&o+s>=0&&o+s<=d){const r=m[A([e+t,o+s])];r&&n.push(r)}return n.flat()})(t);for(const n of o)if((!e||!i.isPointInPath(n[0],n[1]))&&g(n,t)<4)return!0;return!1},k=t=>{const[e,o]=t;return e<20||e>1180||o<20||o>655},x=(t,e=t,o=1,n=!0,s=0)=>{n&&(i.beginPath(),i.moveTo(t[0],t[1]));const r=D(e);let l=[e[0]+r[0]*o,e[1]+r[1]*o];v(l,!0)||k(l)?o>0?(i.moveTo(...t),l=t,x(t,l,-1,!1)):(i.lineWidth=2,i.strokeStyle=M[Math.round(D(t,!1)[1]/(2*u)*M.length)],i.stroke(),w.splice(w.indexOf(t),1)):(n&&m[I(e)].push(e),s%5==0&&(t=>{const[e,o]=t,n=D(t,!1)[0],s=[q(n-Math.PI/2,4),q(n+Math.PI/2,4)],r=[[e+s[0][0],o+s[0][1]],[e+s[1][0],o+s[1][1]]];for(const t of r)v(t,!1)||k(t)||w.push(t)})(e),s++,m[I(l)].push(l),i.lineTo(l[0],l[1]),x(t,l,o,!1,s))};c.style.background="#27272E",(t=>{for(t||(t=((t=1200,e=675)=>[b()*t,b()*e])()),w.push(t);w.length>0;){const t=(e=w)[Math.floor(b()*e.length)];v(t)?w.splice(w.indexOf(t),1):x(t)}var e})()})();
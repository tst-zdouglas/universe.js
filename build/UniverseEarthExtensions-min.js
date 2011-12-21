var Constants={radiusEarth:6378.1363,muEarth:398600.4418,eccEarthSphere:0.081819221456};var CoordinateConversionTools={convertCurrentEpochToJulianDate:function(f){var c=0;var e=f.getUTCFullYear();var g=f.getUTCMonth()+1;var b=f.getUTCDate();var a=f.getUTCHours();var h=f.getUTCMinutes();var d=f.getUTCSeconds()+(f.getUTCMilliseconds()/1000);c=367*e-Math.floor((7*(e+Math.floor(((g+9)/12)))/4))+Math.floor((275*g/9))+(b)+1721013.5+((d/60+h)/60+a)/24;return c},convertTimeToGMST:function(d){var c=this.convertCurrentEpochToJulianDate(d);var b=(c-2451545)/36525;var a=67310.54841+(876600*3600+8640184.812866)*b+0.093104*b*b-(0.0000062)*b*b*b;var e=Math.floor(a/86400);a=a-e*86400;a=a/240;if(a<0){a=a+360}return a},convertLLAtoECEF:function(j){var i=MathTools.toRadians(j.getLatitude());var b=MathTools.toRadians(j.getLongitude());var c=Constants.radiusEarth;var m=Constants.eccEarthSphere;var d=Math.sin(i);var g=j.getAltitude();var e=c/Math.sqrt(1-m*m*d*d);var a=c*(1-m*m)/Math.sqrt(1-m*m*d*d);var l=(e+g)*(Math.cos(i)*Math.cos(b));var k=(e+g)*(Math.cos(i)*Math.sin(b));var h=(a+g)*(Math.sin(i));var f=new ECEFCoordinates(l,k,h,0,0,0,0,0,0);return f},convertECEFtoLLA:function(a){var j=new LLAcoordinates();var o=a.getX();var n=a.getY();var m=a.getZ();var k=Constants.eccEarthSphere;var r=Constants.radiusEarth;var w=Math.sqrt((o*o)+(n*n));var i=n/w;var e=o/w;var f=Math.atan(i/e);var l=f;var d=m/w;var v=Math.atan(d);var s=1e-8;var u=0;var g=v;var p=2000;var t;var b;var h=0;while(Math.abs(g-p)>s){p=g;t=Math.sin(p);u=r/Math.sqrt(1-(k*k*t*t));b=(m+u*k*k*t)/w;g=Math.atan(b);h++;if(h>500){g=0;p=0}}if(l<-Math.PI){l=l+2*Math.PI}if(l>Math.PI){l=l-2*Math.PI}j.setLatitude(MathTools.toDegrees(g));j.setLongitude(MathTools.toDegrees(l));j.setAltitude(w/Math.cos(g)-u);return j},convertECItoECEF:function(f,d){var b=new ECEFcoordinates();eciPos=new Array();eciPos[0]=f.getX();eciPos[1]=f.getY();eciPos[2]=f.getZ();var a=MathTools.rot3(d,eciPos);b.setX(a[0]);b.setY(a[1]);b.setZ(a[2]);var c=new Array();c[0]=f.getVX();c[1]=f.getVY();c[2]=f.getVZ();a=MathTools.rot3(d,c);b.setVx(a[0]);b.setVy(a[1]);b.setVz(a[2]);var e=new Array();e[0]=f.getAx();e[1]=f.getAy();e[2]=f.getAz();a=MathTools.rot3(d,e);b.setAx(a[0]);b.setAy(a[1]);b.setAz(a[2]);return b},convertECEFtoECI:function(b,d){var f=new UNIVERSE.ECICoordinates();var g=new Array();g[0]=b.getX();g[1]=b.getY();g[2]=b.getZ();var a=MathTools.rot3(-d,g);f.setX(a[0]);f.setY(a[1]);f.setZ(a[2]);var c=new Array();c[0]=b.getVX();c[1]=b.getVY();c[2]=b.getVZ();a=MathTools.rot3(-d,c);f.setVX(a[0]);f.setVY(a[1]);f.setVZ(a[2]);var e=new Array();e[0]=b.getAX();e[1]=b.getAY();e[2]=b.getAZ();a=MathTools.rot3(-d,e);f.setAX(a[0]);f.setAY(a[1]);f.setAZ(a[2]);return f},convertECItoLLA:function(c,b){var a=convertECItoECEF(c,b);return convertECEFtoLLA(a)},convertLLAtoECI:function(b,c){var a=this.convertLLAtoECEF(b);return this.convertECEFtoECI(a,c)},convertKeplerianToECI:function(d){var t=new UNIVERSE.ECICoordinates();var m=d.getSemimajorAxis();var j=d.getEccentricity();var b=m*(1-j*j);var l=d.getTrueAnomaly();var f=Math.cos(Math.toRadians(l));var g=Math.sin(Math.toRadians(l));var s=b*f/(1+j*f);var k=b*g/(1+j*f);var h=0;var o=new Array();o[0]=s;o[1]=k;o[2]=h;var n=new Array();n=MathTools.rot3(-d.getArgOfPerigee(),o);n=MathTools.rot1(-d.getInclination(),n);n=MathTools.rot3(-d.getRaan(),n);t.setX(n[0]);t.setY(n[1]);t.setZ(n[2]);var i=-Math.sqrt(Constants.muEarth/b)*g;var c=Math.sqrt(Constants.muEarth/b)*(j+f);var r=0;o[0]=i;o[1]=c;o[2]=r;n=MathTools.rot3(-d.getArgOfPerigee(),o);n=MathTools.rot1(-d.getInclination(),n);n=MathTools.rot3(-d.getRaan(),n);t.setVx(n[0]);t.setVy(n[1]);t.setVz(n[2]);return t},convertECIToKeplerian:function(m){var H=new KeplerianCoordinates();var w=new Array();w[0]=m.x;w[1]=m.y;w[2]=m.z;var s=new Array();s[0]=m.vx;s[1]=m.vy;s[2]=m.vz;var F=MathTools.cross(w,s);var x=MathTools.magnitude(F);var d=MathTools.magnitude(w);var C=MathTools.magnitude(s);var b=new Array();b[0]=0;b[1]=0;b[2]=1;var z=new Array();z=MathTools.cross(b,F);var D=C*C-Constants.muEarth/d;var B=MathTools.dotMultiply(w,s);var J=new Array();var E=0;for(E=0;E<3;E++){J[E]=(1/Constants.muEarth)*(D*w[E]-B*s[E])}var f=MathTools.magnitude(J);var G=C*C/2-Constants.muEarth/d;var y=0;var K=0;if(f==1){K=Infinity;y=x*x/Constants.muEarth}else{K=-Constants.muEarth/(2*G);y=K*(1-f*f)}var o=MathTools.toDegrees(Math.acos(F[2]/x));var k=MathTools.toDegrees(Math.acos(z[0]/MathTools.magnitude(z)));if(z[1]<0){k=360-k}var g=MathTools.toDegrees(Math.acos(MathTools.dotMultiply(z,J)/(MathTools.magnitude(z)*f)));if(J[2]<0){g=360-g}var A=MathTools.dotMultiply(J,w)/(f*d);if(A>1){A=1}var L=MathTools.toDegrees(Math.acos(A));if(MathTools.dotMultiply(s,w)<0){L=360-L}if(isNaN(k)){k=0.00001}if(isNaN(g)){g=0.00001}H.setSemimajorAxis(K);H.setEccentricity(f);H.setTrueAnomaly(L);H.setRaan(k);H.setInclination(o);H.setMeanMotion(MathTools.toDegrees(Math.sqrt(Constants.muEarth/(K*K*K))));H.setArgOfPerigee(g);var t=Math.sin(MathTools.toRadians(L));var j=Math.cos(MathTools.toRadians(L));var u=((t*Math.sqrt(1-f*f))/(1+f*j));var l=((f+j)/(1+f*j));var c=Math.atan2(u,l);var I=c-f*u;I=MathTools.toDegrees(I);H.setMeanAnomaly(I);return H},buildRotationMatrixToConvertECItoRSW:function(e){var f=e.getKepler();var c=f.getTrueAnomaly();var a=f.getArgOfPerigee();var g=f.getInclination();var b=f.getRaan();var h=new Array(3);var d=0;for(var d=0;d<3;d++){h[d]=new Array(3)}h=MathTools.buildRotationMatrix3(b);h=MathTools.multiply(MathTools.buildRotationMatrix1(g),h);h=MathTools.multiply(MathTools.buildRotationMatrix3(a),h);h=MathTools.multiply(MathTools.buildRotationMatrix3(c),h);return h},convertTargetECIToSatelliteRSW:function(i,f){var d=new RSWcoordinates();var e=i.getKepler();var a=i.getEci();var g=e.getTrueAnomaly();var j=e.getArgOfPerigee();var b=e.getInclination();var h=e.getRaan();var c=new Array();c[0]=f.getX()-a.getX();c[1]=f.getY()-a.getY();c[2]=f.getZ()-a.getZ();c=MathTools.rot3(h,c);c=MathTools.rot1(b,c);c=MathTools.rot3(j,c);c=MathTools.rot3(g,c);d.setRadial(c[0]);d.setAlongTrack(c[1]);d.setCrossTrack(c[2]);return d},convertRSWToECI:function(g,d){var j=new UNIVERSE.ECICoordinates();var e=g.getKepler();var f=e.getTrueAnomaly();var i=e.getArgOfPerigee();var b=e.getInclination();var h=e.getRaan();var a=new Array();a[0]=d.getRadial();a[1]=d.getAlongTrack();a[2]=d.getCrossTrack();var c=new Array();c=MathTools.rot3(-f,a);c=MathTools.rot3(-i,c);c=MathTools.rot1(-b,c);c=MathTools.rot3(-h,c);j.setX(c[0]);j.setY(c[1]);j.setZ(c[2]);return j},getSunPositionECIAtCurrentTime:function(d){var f=this.convertCurrentEpochToJulianDate(d);var a=(f-2451545)/36525;var b=280.4606184+36000.77005361*a;var g=357.5277233+35999.05034*a;var c=b+1.914666471*Math.sin(Math.toRadians(g))+0.019994643*Math.sin(2*Math.toRadians(g));var k=1.000140612-0.016708617*Math.cos(Math.toRadians(g))-0.000139589*Math.cos(2*Math.toRadians(g));var h=23.439291-0.0130042*a;var j=149597870;var i=new UNIVERSE.ECICoordinates();i.setX(k*Math.cos(Math.toRadians(c))*j);i.setY(k*Math.cos(Math.toRadians(h))*Math.sin(Math.toRadians(c))*j);i.setZ(k*Math.sin(Math.toRadians(h))*Math.sin(Math.toRadians(c))*j);return i},convertCurrentEpochToBarycentricTime:function(d){var f=new Date(d);var a=new Date(f.getTime()-463);var g=new Date(a.getTime()+32000);var c=new Date(g.getTime()+32184);var b=this.convertCurrentEpochToJulianDate(c);var i=(b-2451545)/36525;var h=new Date(c.getTime()+((0.001658*Math.sin(628.3076*i+6.2401))*1000));var j=this.convertCurrentEpochToJulianDate(h);var e=(j-2451545)/36525;return e},getMoonPositionECIAtCurrentTime:function(c){var a=CoordinateConversionTools.convertCurrentEpochToBarycentricTime(c);var b=218.32+481267.883*a;b+=6.29*Math.sin(MathTools.toRadians(134.9+477198.85*a));b+=-1.27*Math.sin(MathTools.toRadians(259.2-413335.38*a));b+=0.66*Math.sin(MathTools.toRadians(235.7+890534.23*a));b+=0.21*Math.sin(MathTools.toRadians(269.9+954397.7*a));b+=-0.19*Math.sin(MathTools.toRadians(357.5+35999.05*a));b+=-0.11*Math.sin(MathTools.toRadians(186.6+96640.05*a));if(Math.abs(b)>360){b=(b%360)}if(b<0){b+=360}var d=5.13*Math.sin(MathTools.toRadians(93.3+483202.03*a));d+=0.28*Math.sin(MathTools.toRadians(228.2+960400.87*a));d+=-0.28*Math.sin(MathTools.toRadians(318.3+6003.18*a));d+=-0.17*Math.sin(MathTools.toRadians(217.6-407332.2*a));if(Math.abs(d)>360){d=(d%360)}if(d<0){d+=360}var g=0.9508+0.0518*Math.cos(MathTools.toRadians(134.9+477198.85*a));g+=+0.0095*Math.cos(MathTools.toRadians(259.2-413335.38*a));g+=+0.0078*Math.cos(MathTools.toRadians(235.7+890534.23*a));g+=+0.0028*Math.cos(MathTools.toRadians(269.9+954397.7*a));if(Math.abs(g)>360){g=(g%360)}if(g<0){g+=360}var f=23.439291-0.0130042*a;var h=1/Math.sin(MathTools.toRadians(g));h=h*Constants.radiusEarth;f=MathTools.toRadians(f);d=MathTools.toRadians(d);b=MathTools.toRadians(b);moonPosition=new UNIVERSE.ECICoordinates();moonPosition.setX(h*Math.cos(d)*Math.cos(b));moonPosition.setY(h*(Math.cos(f)*Math.cos(d)*Math.sin(b)-Math.sin(f)*Math.sin(d)));moonPosition.setZ(h*(Math.sin(f)*Math.cos(d)*Math.sin(b)+Math.cos(f)*Math.sin(d)));return moonPosition}};var CoordinateFunctionHelper={updateKeplerianAnglesUsingTrueAnomaly:function(c){var a=Math.toRadians(trueAnomaly);var d=Math.sin(a)*Math.sqrt(1-c.eccentricity*c.eccentricity)/(1+c.eccentricity*Math.cos(a));var b=(c.eccentricity+Math.cos(a))/(1+c.eccentricity*Math.cos(a));c.eccentricAnomaly=Math.toDegrees(Math.atan2(d,b));c.meanAnomaly=Math.toDegrees(Math.toRadians(c.eccentricAnomaly)-c.eccentricity*d)},setKeplerianTrueAnomaly:function(a,b){a.trueAnomaly=b;updateAnglesUsingTrueAnomaly(a)}};function ECEFCoordinates(h,f,d,g,c,a,e,b,i){this.x=h?h:0,this.y=f?f:0,this.z=d?d:0,this.vx=g?g:0,this.vy=c?c:0,this.vz=a?a:0,this.ax=e?e:0,this.ay=b?b:0,this.az=i?i:0;this.getX=function(){return this.x};this.setX=function(j){this.x=j};this.getY=function(){return this.y};this.setY=function(j){this.y=j};this.getZ=function(){return this.z};this.setZ=function(j){this.z=j};this.getVX=function(){return this.vx};this.setVX=function(j){this.vx=j};this.getVY=function(){return this.vy};this.setVY=function(j){this.vy=j};this.getVZ=function(){return this.vz};this.setVZ=function(j){this.vz=j};this.getAX=function(){return this.ax};this.setAX=function(j){this.ax=j};this.getAY=function(){return this.ay};this.setAY=function(j){this.ay=j};this.getAZ=function(){return this.az};this.setAZ=function(j){this.az=j}}var UNIVERSE=UNIVERSE||{};UNIVERSE.ECICoordinates=function(h,f,d,g,c,a,e,b,i){this.x=h?h:0,this.y=f?f:0,this.z=d?d:0,this.vx=g?g:0,this.vy=c?c:0,this.vz=a?a:0,this.ax=e?e:0,this.ay=b?b:0,this.az=i?i:0;this.getX=function(){return this.x};this.setX=function(j){this.x=j};this.getY=function(){return this.y};this.setY=function(j){this.y=j};this.getZ=function(){return this.z};this.setZ=function(j){this.z=j};this.getVX=function(){return this.vx};this.setVX=function(j){this.vx=j};this.getVY=function(){return this.vy};this.setVY=function(j){this.vy=j};this.getVZ=function(){return this.vz};this.setVZ=function(j){this.vz=j};this.getAX=function(){return this.ax};this.setAX=function(j){this.ax=j};this.getAY=function(){return this.ay};this.setAY=function(j){this.ay=j};this.getAZ=function(){return this.az};this.setAZ=function(j){this.az=j}};function KeplerianCoordinates(f,g,d,e,a,b,c,i,h){this.semimajorAxis=f?f:0,this.meanAnomaly=g?g:0,this.eccentricAnomaly=g?g:0,this.trueAnomaly=e?e:0,this.inclination=a?a:0,this.eccentricity=b?b:0,this.raan=c?c:0,this.argOfPerigee=i?i:0,this.meanMotion=h?h:0;this.getSemimajorAxis=function(){return this.semimajorAxis};this.getMeanAnomaly=function(){return this.meanAnomaly};this.getEccentricAnomaly=function(){return this.eccentricAnomaly};this.getTrueAnomaly=function(){return this.trueAnomaly};this.getInclination=function(){return this.inclination};this.getEccentricity=function(){return this.eccentricity};this.getRaan=function(){return this.raan};this.getArgOfPerigee=function(){return this.argOfPerigee};this.getMeanMotion=function(){return this.meanMotion};this.setSemimajorAxis=function(j){this.semimajorAxis=j};this.setMeanAnomaly=function(j){this.meanAnomaly=j};this.setEccentricAnomaly=function(j){this.eccentricAnomaly=j};this.setTrueAnomaly=function(j){this.trueAnomaly=j};this.setInclination=function(j){this.inclination=j};this.setEccentricity=function(j){this.eccentricity=j};this.setRaan=function(j){this.raan=j};this.setArgOfPerigee=function(j){this.argOfPerigee=j};this.setMeanMotion=function(j){this.meanMotion=j}}function LLACoordinates(b,c,a){this.latitude=b?b:0,this.longitude=c?c:0,this.altitude=a?a:0;this.getAltitude=function(){return this.altitude};this.setAltitude=function(d){this.altitude=d};this.getLatitude=function(){return this.latitude};this.setLatitude=function(d){this.latitude=d};this.getLongitude=function(){return this.longitude};this.setLongitude=function(d){this.longitude=d}}var MathTools={scalarMultiply:function(c,d){var f=c.length;var b=new Array();for(var e=0;e<f;e++){b[e]=c[e]*d}return b},dotMultiply:function(a,e){if(a.length!=e.length){return 0}else{var d=a.length;var c=0;for(var b=0;b<d;b++){c+=(a[b]*e[b])}return c}},angleBetweenTwoVectors:function(a,f){var e=0;var d=magnitude(a);var c=magnitude(f);var b=dotMultiply(a,f);e=Math.toDegrees(Math.acos(b/(d*c)));return e},magnitude:function(a){var b=0;b=Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);return b},cross:function(b,c){var a=new Array();a[0]=b[1]*c[2]-c[1]*b[2];a[1]=-(b[0]*c[2]-c[0]*b[2]);a[2]=b[0]*c[1]-c[0]*b[1];return a},rot1:function(b,c){b=MathTools.toRadians(b);var a=new Array();a[0]=c[0];a[1]=Math.cos(b)*c[1]+Math.sin(b)*c[2];a[2]=-Math.sin(b)*c[1]+Math.cos(b)*c[2];return a},rot2:function(b,c){b=MathTools.toRadians(b);var a=new Array();a[0]=Math.cos(b)*c[0]-Math.sin(b)*c[2];a[1]=c[1];a[2]=Math.sin(b)*c[0]+Math.cos(b)*c[2];return a},rot3:function(b,c){b=MathTools.toRadians(b);var a=new Array();a[0]=Math.cos(b)*c[0]+Math.sin(b)*c[1];a[1]=-Math.sin(b)*c[0]+Math.cos(b)*c[1];a[2]=c[2];return a},toRadians:function(a){return a*Math.PI/180},toDegrees:function(a){return a*180/Math.PI},buildRotationMatrix1:function(b){b=Math.toRadians(b);var a=new Array();var c=0;for(c=0;c<3;c++){a[c]=new Array()}a[0][0]=1;a[0][1]=0;a[0][2]=0;a[1][0]=0;a[1][1]=Math.cos(b);a[1][2]=-Math.sin(b);a[2][0]=0;a[2][1]=Math.sin(b);a[2][2]=Math.cos(b);return a},buildRotationMatrix2:function(b){b=Math.toRadians(b);var a=new Array();var c=0;for(c=0;c<3;c++){a[c]=new Array()}a[0][0]=Math.cos(b);a[0][1]=0;a[0][2]=Math.sin(b);a[1][0]=0;a[1][1]=1;a[1][2]=0;a[2][0]=-Math.sin(b);a[2][1]=0;a[2][2]=Math.cos(b);return a},buildRotationMatrix3:function(b){b=Math.toRadians(b);var a=new Array();var c=0;for(c=0;c<3;c++){a[c]=new Array()}a[0][0]=Math.cos(b);a[0][1]=-Math.sin(b);a[0][2]=0;a[1][0]=Math.sin(b);a[1][1]=Math.cos(b);a[1][2]=0;a[2][0]=0;a[2][1]=0;a[2][2]=1;return a},ones:function(d){var a=new Array();var c=0;var b=0;for(c=0;c<d;c++){result[c]=new Array(d)}for(c=0;c<d;c++){for(b=0;b<d;b++){if(c!=b){a[c][b]=0}else{a[c][b]=1}}}return a},zeros:function(d){var a=new Array(d);var c=0;var b=0;for(c=0;c<d;c++){result[c]=new Array(d)}for(c=0;c<d;c++){for(b=0;b<d;b++){a[c][b]=0}}return a},zeros:function(e,d){var a=new Array(e);var c=0;var b=0;for(c=0;c<e;c++){result[c]=new Array(d)}for(c=0;c<e;c++){for(b=0;b<d;b++){a[c][b]=0}}return a},multiply1dBy2d:function(k,f){var a=k.length;var h=f.length;var g=f[0].length;if(a!=h){return null}var e=new Array(g);for(var d=0;d<g;d++){var b=0;for(var c=0;c<a;c++){b=b+k[c]*f[c][d]}e[d]=b}return e},multiply2dBy1d:function(k,h){var g=k.length;var d=k[0].length;var a=h.length;if(d!=a){return null}var f=new Array(g);for(var e=0;e<g;e++){var b=0;for(var c=0;c<a;c++){b=b+k[e][c]*h[c]}f[e]=b}return f},multiplyDoubleBy2d:function(d,a){var g=a.length;var e=a[0].length;var f=new Array(g);var c=0;var b=0;for(c=0;c<g;c++){f[c]=new Array(e)}for(c=0;c<g;c++){for(b=0;b<e;b++){if(a[c][b]==0){f[c][b]=0}else{f[c][b]=d*a[c][b]}}}return f},multiply2dBy2d:function(n,h){var b=n.length;var a=n[0].length;var m=h.length;var l=h[0].length;if(a!=m){return null}var g=new Array(b);var f=0;var e=0;for(f=0;f<b;f++){result[f]=new Array(l)}for(f=0;f<b;f++){for(e=0;e<l;e++){var c=0;var d=0;for(d=0;d<m;d++){c=c+n[f][d]*h[d][e]}g[f][e]=c}}return g},transposeMatrix:function(a){var d=a.length;var b=a[0].length;var f=new Array(b);var e=0;var c=0;for(e=0;e<b;e++){f[e]=new Array(d)}for(e=0;e<d;e++){for(c=0;c<b;c++){f[c][e]=a[e][c]}}return f},add1dTo1d:function(a,f){var b=a.length;var e=f.length;if(b!=e){return null}var d=new Array(b);var c=0;for(c=0;c<b;c++){d[c]=a[c]+f[c]}return d},add2dTo2d:function(k,f){var b=k.length;var a=k[0].length;var h=f.length;var g=f[0].length;if((b!=h)||(a!=g)){return null}var e=new Array(b);var d=0;var c=0;for(d=0;d<b;d++){e[d]=new Array(a)}for(d=0;d<b;d++){for(c=0;c<a;c++){e[d][c]=k[d][c]+f[d][c]}}return e},subtract2dMinus2d:function(k,f){var b=k.length;var a=k[0].length;var h=f.length;var g=f[0].length;if((b!=h)||(a!=g)){return null}var e=new Array(b);var d=0;var c=0;for(d=0;d<b;d++){e[d]=new Array(a)}for(d=0;d<b;d++){for(c=0;c<a;c++){e[d][c]=k[d][c]-f[d][c]}}return e},subtract1dMinus1d:function(a,f){var b=a.length;var e=f.length;if(b!=e){return null}var d=new Array(b);var c=0;for(c=0;c<b;c++){d[c]=a[c]-f[c]}return d}};function Quaternion(){this.w=xVal?xVal:0,this.x=xVal?xVal:0,this.y=yVal?yVal:0,this.z=zVal?zVal:0,this.q=new Array(4);this.updateQ=function(){this.q[0]=this.w;this.q[1]=this.x;this.q[2]=this.y;this.q[3]=this.z};this.getQ=function(){return q};this.setQ=function(a){this.w=a[0];this.x=a[1];this.y=a[2];this.z=a[3];this.q=a};this.getW=function(){return this.w};this.setW=function(a){this.w=a;updateQ()};this.getX=function(){return this.x};this.setX=function(a){this.x=a;updateQ()};this.getY=function(){return this.y};this.setY=function(a){this.y=a;updateQ()};this.getZ=function(){return this.z};this.setZ=function(a){this.z=a;updateQ()};this.isZero=function(){var b=true;var a=0;for(a=0;a<4;a++){if(this.q[a]!=null){if(this.q[a]!=0){b=false;break}}}return b}}var QuaternionMath={multiplyQuaternions:function(h,g){if(h.isZero()){return g}else{if(g.isZero()){return h}else{var f=h.getW();var b=h.getX();var j=h.getY();var d=h.getZ();var e=g.getW();var a=g.getX();var i=g.getY();var c=g.getZ();var k=new Quaternion();k.setW(f*e-b*a-j*i-d*c);k.setX(f*a+b*e+j*c-d*i);k.setY(f*i+j*e+d*a-b*c);k.setZ(f*c+d*e+b*i-j*a);return k}}},applyQuaternionRotation:function(h,c){var j=h.getW();var g=h.getX();var f=h.getY();var e=h.getZ();var b=new Array(3);var d=0;for(d=0;d<3;d++){b[d]=new Array(3)}b[0][0]=2*j*j-1+2*g*g;b[0][1]=2*g*f+2*j*e;b[0][2]=2*g*e-2*j*f;b[1][0]=2*g*f-2*j*e;b[1][1]=2*j*j-1+2*f*f;b[1][2]=2*f*e+2*j*g;b[2][0]=2*g*e+2*j*f;b[2][1]=2*f*e-2*j*g;b[2][2]=2*j*j-1+2*e*e;var a=MathTools.multiply(b,c);return a},getEulerAngles:function(a){var i=a.getW();var g=a.getX();var f=a.getY();var e=a.getZ();var h=Math.atan2((2*(i*g+f*e)),(1-2*(g*g+f*f)));var b=Math.asin(2*(i*f-e*g));var d=Math.atan2((2*(i*e+g*f)),(1-2*(f*f+e*e)));var c=new Array(3);c[0]=Math.toDegrees(h);c[1]=Math.toDegrees(b);c[2]=Math.toDegrees(d);return c},convertRotationMatrixToQuaternion:function(e){var b=new Quaternion();var h=e[0][0];var g=e[0][1];var f=e[0][2];var d=e[1][0];var c=e[1][1];var a=e[1][2];var k=e[2][0];var j=e[2][1];var i=e[2][2];b.setW(0.5*Math.sqrt(h+c+i+1));b.setX((a-j)/(4*b.getW()));b.setY((k-f)/(4*b.getW()));b.setZ((g-d)/(4*b.getW()));return b}};function RSWCoordinates(){radial=0,alongTrack=0,crossTrack=0}var SimulationObject={name:"",eciCoords:UNIVERSE.ECICoordinates,ecefCoords:ECEFCoordinates,keplerCoords:KeplerianCoordinates,llaCoords:LLACoordinates,sensorList:new Array(),getEcefCoordinates:function(){return ecefCoords},setEcefCoordinates:function(a){ecefCoords=a},getEciCoordinates:function(){return eciCoords},setEciCoordinates:function(a){eciCoords=a},getKeplerianCoordinates:function(){return keplerCoords},setKeplerianCoordinates:function(a){kepler=a},getLlaCoordinates:function(){return llaCoords},setLlaCoordinates:function(a){lla=a},getName:function(){return name},setName:function(a){this.name=a},getSensors:function(){return sensors},setSensors:function(a){sensorList=a},propagateState:function(f,d,b){eciCoords=OrbitPropagator.propagateOrbit(eci,f,d,b);keplerCoords=CoordinateConversionTools.convertECIToKeplerian(eci);var e=(b.getTime()+(f*1000));var a=new Date(e);var c=CoordinateConversionTools.convertTimeToGMST(a);ecefCoords=CoordinateConversionTools.convertECItoECEF(eci,c);llaCoords=CoordinateConversionTools.convertECItoLLA(eci,c)}};var HarmonicTerms={calculatePerturbationTerms:function(b,a){}};var OrbitPropagator={rungeKuttaFehlbergIntegrator:function(a,o,r,d){var p=a;var z=new Array();var c=new Array();var t=0;var k=1;var x=r;var s=0.02;if(r>s){x=s}var y=d.getTime();k=o/x;var u=1;for(u=1;u<=k;u++){y=y+(x*1000);var w=new Date(y);GST=CoordinateConversionTools.convertTimeToGMST(w);var n=new Array();var m=new Array();var l=new Array();var g=new Array();var e=new Array();var b=new Array();var v=0;for(v=0;v<9;v++){c[v]=p[v]}t=x;z=this.generateStateUpdate(c,t,GST);for(v=0;v<9;v++){n[v]=x*z[v]}for(v=0;v<9;v++){c[v]=p[v]+0.25*n[v]}t=0.25*x;z=this.generateStateUpdate(c,t,GST);for(v=0;v<9;v++){m[v]=x*z[v]}for(v=0;v<9;v++){c[v]=p[v]+(3/32)*n[v]+(9/32)*m[v]}t=0.375*x;z=this.generateStateUpdate(c,t,GST);for(v=0;v<9;v++){l[v]=x*z[v]}for(v=0;v<9;v++){c[v]=p[v]+((1932/2197)*n[v])-((7200/2197)*m[v])+((7296/2197)*l[v])}t=0.9230769230769231*x;z=this.generateStateUpdate(c,t,GST);for(v=0;v<9;v++){g[v]=x*z[v]}for(v=0;v<9;v++){c[v]=p[v]+((439/216)*n[v])-(8*m[v])+((3680/513)*l[v])-((845/4104)*g[v])}t=x;z=this.generateStateUpdate(c,t,GST);for(v=0;v<9;v++){e[v]=x*z[v]}for(v=0;v<9;v++){c[v]=p[v]-((8/27)*n[v])+((2)*m[v])-((3544/2565)*l[v])+((1859/4104)*g[v])-((11/40)*e[v])}t=(0.5)*x;z=this.generateStateUpdate(c,t,GST);for(v=0;v<9;v++){b[v]=x*z[v]}for(v=0;v<9;v++){p[v]=p[v]+((16/135)*n[v])+((6656/12825)*l[v])+((28561/56430)*g[v])-((9/50)*e[v])+((2/55)*b[v])}}return p},generateStateUpdate:function(f,e,d){var a=new Array();var b=Constants.muEarth;var c=Math.sqrt((f[0]*f[0])+(f[1]*f[1])+(f[2]*f[2]));a[0]=f[3];a[1]=f[4];a[2]=f[5];a[3]=-b*f[0]/(c*c*c);a[4]=-b*f[1]/(c*c*c);a[5]=-b*f[2]/(c*c*c);a[6]=0;a[7]=0;a[8]=0;return a},propagateOrbit:function(k,o,C,j){var d=CoordinateConversionTools.convertECIToKeplerian(k);if(o==0||isNaN(d.getEccentricity())){return k}else{if(d.getEccentricity()<=0.1){var M=d.getMeanAnomaly()+d.getMeanMotion()*o;var u=MathTools.toRadians(d.getArgOfPerigee());var H=MathTools.toRadians(d.getRaan());var s=MathTools.toRadians(d.getInclination());var v=d.getEccentricity();var D=Constants.muEarth;M=MathTools.toRadians(M);var b=M*0.95;var G=0.00001;for(var I=0;I<500;I++){var a=M-(b-v*Math.sin(b));if(Math.abs(a)>G){if(a>0){b=b+Math.abs(M-b)/2}else{if(a<0){b=b-Math.abs(M-b)/2}}}else{break}}var L=2*Math.atan(Math.sqrt((1+v)/(1-v))*Math.tan(b/2));var E=d.getSemimajorAxis()*(1-v*v);var B=d.getSemimajorAxis()*(1-v*Math.cos(b));var J=Math.sqrt(D*d.getSemimajorAxis()*(1-v*v));var t=B*(Math.cos(H)*Math.cos(u+L)-Math.sin(H)*Math.sin(u+L)*Math.cos(s));var n=B*(Math.sin(H)*Math.cos(u+L)+Math.cos(H)*Math.sin(u+L)*Math.cos(s));var m=B*Math.sin(s)*Math.sin(u+L);var A=((t*J*v)/(B*E))*Math.sin(L)-(J/B)*(Math.cos(H)*Math.sin(u+L)+Math.sin(H)*Math.cos(u+L)*Math.cos(s));var F=((n*J*v)/(B*E))*Math.sin(L)-(J/B)*(Math.sin(H)*Math.sin(u+L)-Math.cos(H)*Math.cos(u+L)*Math.cos(s));var K=((m*J*v)/(B*E))*Math.sin(L)+(J/B)*(Math.sin(s)*Math.cos(u+L));var l=new UNIVERSE.ECICoordinates();l.setX(t);l.setY(n);l.setZ(m);l.setVX(A);l.setVY(F);l.setVZ(K);l.setAX(0);l.setAY(0);l.setAZ(0);return l}else{var g=new Array();g[0]=k.x;g[1]=k.y;g[2]=k.z;g[3]=k.vx;g[4]=k.vy;g[5]=k.vz;g[6]=k.ax;g[7]=k.ay;g[8]=k.az;var e=this.rungeKuttaFehlbergIntegrator(g,o,C,j);var c=new UNIVERSE.ECICoordinates(e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8]);return c}}}};var UNIVERSE=UNIVERSE||{};UNIVERSE.GroundObject=function(d,c,b,a){if(d==undefined){return undefined}this.id=d;this.objectName=c||d;this.propagator=a;this.modelId=b};UNIVERSE.GroundObject.prototype={constructor:UNIVERSE.GroundObject,set:function(d,c,a,b){this.id=d;this.objectName=c||d;this.propagator=a;this.modelId=b;return this}};var UNIVERSE=UNIVERSE||{};UNIVERSE.SpaceObject=function(f,e,d,c,b,a){if(f==undefined){return undefined}this.id=f;this.objectName=e||f;this.propagator=c;this.modelId=d;this.showPropagationLine=b||false;this.showGroundTrackPoint=a||false};UNIVERSE.SpaceObject.prototype={constructor:UNIVERSE.SpaceObject,set:function(f,e,c,d,b,a){this.id=f;this.objectName=e||f;this.propagator=c;this.modelId=d;this.showPropagationLine=showPropagationLine||false;this.showGroundTrackPoint=a||false;return this}};var UNIVERSE=UNIVERSE||{};UNIVERSE.EarthExtensions=function(e){var a=this;var b=6371;var f=new THREE.Vector3(0,0,0);var d=undefined;e.setObjectInLibrary("default_ground_object_geometry",new THREE.SphereGeometry(200,20,10));e.setObjectInLibrary("default_ground_object_material",new THREE.MeshLambertMaterial({color:13369344}));e.setObjectInLibrary("default_ground_track_material",new THREE.MeshBasicMaterial({color:13369344,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending}));e.setObjectInLibrary("default_sensor_projection_material",new THREE.MeshBasicMaterial({color:16755200,transparent:true,blending:THREE.AdditiveBlending,overdraw:true,opacity:0.15}));e.setObjectInLibrary("default_orbit_line_material",new THREE.LineBasicMaterial({color:10027008,opacity:1}));e.setObjectInLibrary("default_ground_object_tracing_line_material",new THREE.LineBasicMaterial({color:39168,opacity:1}));this.addEarth=function(o){var k=40,i=30;var m=new THREE.SphereGeometry(b,k,i);var h={uniforms:{texture:{type:"t",value:0,texture:null}},vertexShader:["varying vec3 vNormal;","varying vec2 vUv;","void main() {","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","vNormal = normalize( normalMatrix * normal );","vUv = uv;","}"].join("\n"),fragmentShader:["uniform sampler2D texture;","varying vec3 vNormal;","varying vec2 vUv;","void main() {","vec3 diffuse = texture2D( texture, vUv ).xyz;","float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );","vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );","gl_FragColor = vec4( diffuse + atmosphere, 1.0 );","}"].join("\n")};var n=THREE.UniformsUtils.clone(h.uniforms);n.texture.texture=THREE.ImageUtils.loadTexture(o.image);var j=new THREE.ShaderMaterial({uniforms:n,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader});var g=new THREE.Mesh(m,j);var l=new UNIVERSE.GraphicsObject("earth","earth",function(p){var r=CoordinateConversionTools.convertTimeToGMST(e.getCurrentUniverseTime());g.rotation.y=r*(2*Math.PI/360)},function(){e.draw(this.id,g,false)});e.addObject(l)};this.addMoon=function(p){var n=40,h=30;var i=1737.1;var m=new THREE.SphereGeometry(i,n,h);var k={uniforms:{texture:{type:"t",value:0,texture:null}},vertexShader:["varying vec3 vNormal;","varying vec2 vUv;","void main() {","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","vNormal = normalize( normalMatrix * normal );","vUv = uv;","}"].join("\n"),fragmentShader:["uniform sampler2D texture;","varying vec3 vNormal;","varying vec2 vUv;","void main() {","vec3 diffuse = texture2D( texture, vUv ).xyz;","float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );","vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );","gl_FragColor = vec4( diffuse + atmosphere, 1.0 );","}"].join("\n")};var o=THREE.UniformsUtils.clone(k.uniforms);o.texture.texture=THREE.ImageUtils.loadTexture(p.image);var l=new THREE.ShaderMaterial({uniforms:o,vertexShader:k.vertexShader,fragmentShader:k.fragmentShader});var j=new THREE.Mesh(m,l);var g=new UNIVERSE.GraphicsObject("moon","moon",function(r){var u=new Date(e.getCurrentUniverseTime());var t=CoordinateConversionTools.getMoonPositionECIAtCurrentTime(u);var s=c({x:t.x,y:t.y,z:t.z});j.position={x:s.x,y:s.y,z:s.z}},function(){e.draw(this.id,j,false)});e.addObject(g)};this.addSpaceObject=function(i){var h,g;e.getObjectFromLibraryById(i.modelId,function(j){h=j;e.getObjectFromLibraryById("default_material",function(k){g=k;var l=new THREE.Mesh(h,g);var m=new UNIVERSE.GraphicsObject(i.id,i.objectName,function(n){var o=c(i.propagator());if(o!=undefined){l.position.set(o.x,o.y,o.z);l.lookAt(f)}},function(){e.draw(this.id,l,false);a.showModelForId(i.showVehicle,this.id)});e.addObject(m);a.addPropogationLineForObject(i);a.showOrbitLineForObject(i.showPropogationLine,i.id);a.addGroundTrackPointForObject(i);a.showGroundTrackForId(i.showGroundTrackPoint,i.id);a.addSensorProjection(i);a.showSensorProjectionForId(i.showSensorProjections,i.id);a.addClosestGroundObjectTracingLine(i)})})};this.addGroundObject=function(h){var j,g,i;if(!h.modelId){h.modelId="default_ground_object_geometry";i="default_ground_object_material"}else{i="default_material"}e.getObjectFromLibraryById(h.modelId,function(k){j=k;e.getObjectFromLibraryById(i,function(m){g=m;j.applyMatrix(new THREE.Matrix4().setRotationFromEuler(new THREE.Vector3(Math.PI/2,Math.PI,0)));var l=new THREE.Mesh(j,g);var n=new UNIVERSE.GraphicsObject(h.id,h.objectName,function(r){var p=c(h.propagator());l.position.set(p.x,p.y,p.z);this.currentLocation={x:p.x,y:p.y,z:p.z};var o=new THREE.Vector3(p.x,p.y,p.z);o.multiplyScalar(1.4);l.lookAt(o)},function(){e.draw(this.id,l,true)});n.currentLocation=undefined;e.addObject(n)})})};this.addGroundTrackPointForObject=function(h){var i,g;e.getObjectFromLibraryById("default_ground_object_geometry",function(j){i=j;e.getObjectFromLibraryById("default_ground_track_material",function(l){g=l;var k=new THREE.Mesh(i,g);var m=new UNIVERSE.GraphicsObject(h.id+"_groundPoint",h.objectName,function(o){var p=c(h.propagator(undefined,false));if(p!=undefined){var n=new THREE.Vector3(p.x,p.y,p.z);n.multiplyScalar(b/n.length());k.position.copy(n)}},function(){e.draw(this.id,k,true)});e.addObject(m)})})};this.addPropogationLineForObject=function(h){var i,g;i=new THREE.Geometry();e.getObjectFromLibraryById("default_orbit_line_material",function(o){g=o;var s=new Date(e.getCurrentUniverseTime());var m=1440;for(var n=0;n<m;n+=5){var r=c(h.propagator(s,false));if(r!=undefined){var l=new THREE.Vector3(r.x,r.y,r.z);i.vertices.push(new THREE.Vertex(l))}s.setMinutes(s.getMinutes()+5)}var k=new THREE.Line(i,g);var p=new UNIVERSE.GraphicsObject(h.id+"_propogation",h.objectName,function(j){},function(){e.draw(this.id,k,false)});e.addObject(p)})};this.addSensorProjection=function(j){var k,h;var n=c(j.propagator(undefined,false));if(n!=undefined){var g=1;k=new SensorPatternGeometry(g);var l=new THREE.Vector3(n.x,n.y,n.z);var i=l.length()-b;var m=0.15;e.getObjectFromLibraryById("default_sensor_projection_material",function(o){h=o;var r=new THREE.Mesh(k,h);r.doubleSided=true;var p=new UNIVERSE.GraphicsObject(j.id+"_sensorProjection",j.objectName,function(t){var u=c(j.propagator(undefined,false));if(u!=undefined){var s=new THREE.Vector3(u.x,u.y,u.z);r.position.copy(s);r.scale.z=s.length()-b+200;r.scale.x=r.scale.y=r.scale.z*m;var v=new THREE.Vector3(0,0,0);r.lookAt(v)}},function(){e.draw(this.id,r,false)});e.addObject(p)})}};this.addClosestGroundObjectTracingLine=function(h){var i,g;e.getObjectFromLibraryById("default_ground_object_tracing_line_material",function(k){g=k;var j=undefined;var l=new UNIVERSE.GraphicsObject(h.id+"_controlLine",h.objectName,function(n){var r=c(h.propagator(undefined,false));var p=a.findClosestGroundObject(r);if(p!=undefined){i=new THREE.Geometry();var m=new THREE.Vector3(r.x,r.y,r.z);i.vertices.push(new THREE.Vertex(m));var o=new THREE.Vector3(p.currentLocation.x,p.currentLocation.y,p.currentLocation.z);i.vertices.push(new THREE.Vertex(o));j=new THREE.Line(i,g)}},function(){e.unDraw(this.id);if(j!=undefined){e.draw(this.id,j,false);if(d!=undefined){a.showControlLineForId(d,h.id)}else{a.showControlLineForId(h.showControlLine,h.id)}}});e.addObject(l)})};this.findClosestGroundObject=function(g){if(g!=undefined){var h=new THREE.Vector3(g.x,g.y,g.z);h.multiplyScalar(b/h.length());return a.findClosestObject({x:h.x,y:h.y,z:h.z})}return undefined};this.findClosestObject=function(h){var j=e.getGraphicsObjects();var o=undefined;var m=undefined;var l=new THREE.Vector3(h.x,h.y,h.z);for(var k in j){if(j[k].currentLocation!=undefined){var g=new THREE.Vector3(j[k].currentLocation.x,j[k].currentLocation.y,j[k].currentLocation.z);var n=g.distanceTo(l);if(o==undefined||n<o){m=j[k];o=n}}}return m};this.showAllOrbitLines=function(j){var g=e.getGraphicsObjects();for(var h in g){if(g[h].id.indexOf("_propogation")!=-1){e.showObject(g[h].id,j)}}};this.showOrbitLineForObject=function(g,h){e.showObject(h+"_propogation",g)};this.showModelForId=function(g,h){e.showObject(h,g)};this.showAllGroundTracks=function(j){var g=e.getGraphicsObjects();for(var h in g){if(g[h].id.indexOf("_groundPoint")!=-1){e.showObject(g[h].id,j)}}};this.showGroundTrackForId=function(g,h){e.showObject(h+"_groundPoint",g)};this.showAllSensorProjections=function(j){var g=e.getGraphicsObjects();for(var h in g){if(g[h].id.indexOf("_sensorProjection")!=-1){e.showObject(g[h].id,j)}}};this.showSensorProjectionForId=function(g,h){e.showObject(h+"_sensorProjection",g)};this.showAllControlLines=function(j){d=j;var g=e.getGraphicsObjects();for(var h in g){if(g[h].id.indexOf("_controlLine")!=-1){e.showObject(g[h].id,j)}}};this.showControlLineForId=function(g,h){e.showObject(h+"_controlLine",g)};this.removeAllExceptEarthAndMoon=function(){var g=e.getGraphicsObjects();for(var h in g){if(g[h].id!="earth"&&g[h].id!="moon"){e.removeObject(g[h].id)}}};this.setup=function(){this.removeAllExceptEarthAndMoon();e.setup()};function c(g){if(g==undefined){return undefined}return{x:-g.x,y:g.z,z:g.y}}};
// Generate pixel-safe 192 and 512 PNG fallbacks for the SEVA Global PWA.
import {writeFileSync,mkdirSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const table=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,bytes){
 const name=Buffer.from(type,'ascii'),len=Buffer.alloc(4);len.writeUInt32BE(bytes.length);
 let crc=0xffffffff;for(const b of Buffer.concat([name,bytes]))crc=table[(crc^b)&255]^(crc>>>8);
 const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([len,name,bytes,tail]);
}
export function icon(size){
 if(![192,512].includes(size))throw Error('Expected 192 or 512');
 const bytesPerRow=Math.ceil(size/8),raw=Buffer.alloc((bytesPerRow+1)*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const a=x/size,b=y/size;
  const disk=Math.hypot(a-.275,b-.268)<.094;
  const bar=(a>.382&&a<.785&&b>.209&&b<.326)||(a>.255&&a<.737&&b>.452&&b<.559)||(a>.335&&a<.775&&b>.681&&b<.792);
  if(disk||bar)raw[y*(bytesPerRow+1)+1+(x>>3)]|=1<<(7-(x%8));
 }
 const hdr=Buffer.alloc(13);hdr.writeUInt32BE(size,0);hdr.writeUInt32BE(size,4);hdr[8]=1;hdr[9]=3;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('PLTE',Buffer.from([16,28,53,126,248,204])),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const destination=join(dirname(fileURLToPath(import.meta.url)),'..','public');mkdirSync(destination,{recursive:true});
 for(const size of [192,512])writeFileSync(join(destination,'seva-global-'+size+'.png'),icon(size));
}

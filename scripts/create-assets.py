"""Generate code-native monochrome app icons without external dependencies."""
import struct,zlib
from pathlib import Path
def png(path,n):
    rows=[]
    for y in range(n):
        row=bytearray()
        for x in range(n):
            a,b=x/n,y/n
            black=.17<a<.83 and .17<b<.83
            # A clean checkmark inside the black square.
            check=(.32<a<.47 and abs(b-(a+.17))<.032) or (.44<a<.70 and abs(b-(-a+1.08))<.032)
            value=255 if not black or check else 0
            row.extend([value,value,value,255])
        rows.append(b'\x00'+row)
    def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    Path(path).write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b''))
Path('assets').mkdir(exist_ok=True)
png('assets/icon.png',1024)
png('assets/adaptive-icon.png',1024)
png('assets/splash.png',400)

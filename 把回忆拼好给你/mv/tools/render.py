import cairosvg,sys,glob,os
from multiprocessing import Pool
d=sys.argv[1]
def f(p): cairosvg.svg2png(url=p,write_to=p[:-4]+'.png',output_width=540,output_height=960); os.remove(p)
if __name__=='__main__':
    with Pool(2) as pool: pool.map(f,sorted(glob.glob(d+'/*.svg')),chunksize=8)

smplngRate = 44100
FFTBins = 16384

freq = smplngRate / FFTBins
fmin = 20
fmax = 16000
barcount = 64
cutoff = [0.0]
for i in range(barcount):
    exp = (i/barcount)**0.9
    cutoff.append(fmin * (fmax / fmin) ** (exp))
cutoff.append(16000)


BinRange = []
for i in cutoff:
    BinRange.append(round(i/freq))
    
for i in range(len(cutoff)-1):
    print(i+1, "|", cutoff[i], "-", cutoff[i+1],"->",BinRange[i], "-", BinRange[i+1])  

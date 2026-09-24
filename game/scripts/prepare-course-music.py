"""Convert generated masters into compact level-matched crossfaded gameplay loops."""
import json, subprocess
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
masters=Path(sys.argv[1])
for row in json.loads((root/'production/course-soundtracks.json').read_text()):
    src=masters/(row['id']+'.wav')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(src)]))
    duration=float(probe['format']['duration'])
    assert duration>10
    end=duration-2
    filters=f'[0:a]asplit=3[a][b][c];[a]atrim=start=2:end={end},asetpts=PTS-STARTPTS[mid];[b]atrim=start={end},asetpts=PTS-STARTPTS[tail];[c]atrim=end=2,asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d=2:c1=tri:c2=tri[join];[mid][join]concat=n=2:v=0:a=1,loudnorm=I=-18:TP=-2:LRA=9[out]'
    dest=root/'public/assets/music'/(row['id']+'.mp3')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-filter_complex',filters,'-map','[out]','-ar','44100','-codec:a','libmp3lame','-b:a','96k',str(dest)],check=True)
    print(row['id'],round(duration-2,2),'seconds',dest.stat().st_size,'bytes')

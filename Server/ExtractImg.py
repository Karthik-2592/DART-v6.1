from mutagen.id3 import ID3
from mutagen.mp3 import MP3
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
audio = os.listdir(os.path.join(script_dir, "Storage/audio"))
print(audio)
print("test")
for song in audio:
    if song.endswith(".mp3"):
        Sng = MP3(os.path.join(script_dir, "Storage/audio/" + song))
        if(Sng.tags):
            apic_frames = Sng.tags.getall("APIC")

        if apic_frames:
            with open(os.path.join(script_dir, "Storage/cover/" + song + ".jpg"), "wb") as img:
                img.write(apic_frames[0].data)
        else:
            print("No cover art found. Using default image.")
    else:
        print("Not a mp3 file")
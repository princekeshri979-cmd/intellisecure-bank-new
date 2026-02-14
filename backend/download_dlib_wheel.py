import urllib.request
import os

url = "https://github.com/z-mahmud22/Dlib_Windows_Python3.x/raw/main/dlib-19.24.1-cp311-cp311-win_amd64.whl"
filename = "dlib-19.24.1-cp311-cp311-win_amd64.whl"

print(f"Downloading {filename} from {url}...")

try:
    urllib.request.urlretrieve(url, filename)
    
    if os.path.exists(filename):
        print(f"Successfully downloaded {filename}")
        print(f"File size: {os.path.getsize(filename)} bytes")
    else:
        print("Download failed: File not found after download attempt.")

except Exception as e:
    print(f"Error downloading file: {e}")

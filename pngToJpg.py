from PIL import Image
import os
#look through all files in uploads, if they are .png, convert them to .jpg

# walk through all files in directory
for root, dirs, files in os.walk():
    for i in files:
        if i.endswith(".png"):
            print(i)
            # png to jpg
            im = Image.open(os.path.join(root, i))
            rgbim = im.convert('RGB')
            rgbim.save(os.path.join(root, i.replace(".png", ".jpg")))
            os.remove(os.path.join(root, i))
            

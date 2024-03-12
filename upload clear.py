import os
import shutil
'''
Clears all uploaded files from the system
'''

UPLOAD_DIR = 'uploads'
for filename in os.listdir(UPLOAD_DIR):
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)
    except Exception as e:
        print('Failed to delete %s. Reason: %s' % (file_path, e))
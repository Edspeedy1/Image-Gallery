import http.server
import socketserver
import os
import time
import random
import subprocess
import json
from PIL import Image
import cv2
import threading

time.sleep(2)

PORT = 8000
UPLOAD_DIR = "uploads"
RESULTS_PER_PAGE = 28

# TODO: add auto to:json; 

def filter_tags(tags:list[str], page:int):
    match_list = []
    for i in os.listdir(UPLOAD_DIR):
        json_file = os.path.join(UPLOAD_DIR, i, "data.json")

        for tag in tags:
            if os.path.exists(json_file):
                with open(json_file, "r") as f:
                    c = json.load(f)["tags"]
                    content = '\n'.join(c["0"] + c["tags"] + c["1"] + c["2"]).replace(' ', '')
                if '|' in tag:
                    tag = tag.split('|')
                    match = False
                    for t in tag:
                        if t in content:
                            match = True
                            break
                    if match: 
                        continue
                    break
                if tag in ['', 'random'] or tag.startswith('s:') or tag.startswith('.'): continue
                if tag[0] == '-':
                    if tag[1:] in content:
                        break
                    else:
                        continue
                if tag not in content.split('\n'):
                    break
        else:
            match_list.append(os.listdir(os.path.join(UPLOAD_DIR, i))[0])
    return match_list

def getImageData(imageName, sortType):
    try:
        with open(os.path.join(UPLOAD_DIR, os.path.splitext(imageName)[0], "data.json")) as f:
            data = json.load(f)
            return int(data["data"][sortType])
    except Exception as e:
        print(e)
        return 0

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    pass

class CustomRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'  # default HTML file
        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        conditionFlag = self.headers['conditionFlag']

        if conditionFlag == "pre_Image":
            content = post_data.decode()
            with open('results.txt', 'r') as f:
                results = f.read().splitlines()[1:]
                newIndex = (results.index(content) - 1) % len(results)
            return self.send_json_response(200, results[newIndex])
        
        elif conditionFlag == "next_Image":
            content = post_data.decode()
            with open('results.txt', 'r') as f:
                results = f.read().splitlines()[1:]
                newIndex = (results.index(content) + 1) % len(results)
            return self.send_json_response(200, results[newIndex])
        
        elif conditionFlag == "go_Back":
            with open('results.txt', 'r') as f:
                results = f.read().splitlines()
                self.send_json_response(200, results[0])
        elif conditionFlag == "upload_Image":
            self.handle_file_upload(post_data)
        elif conditionFlag == "search":
            content = json.loads(post_data)
            self.handle_search(content)
        elif conditionFlag == "save_Tags":
            content = json.loads(post_data)
            self.handle_save_tags(content)
        elif conditionFlag == "delete_Image":
            self.handle_delete(post_data)
        elif conditionFlag == "open_Folder":
            self.handle_open_folder(post_data)
        elif conditionFlag == "last_Page":
            self.handle_last_page(post_data)
        
    def handle_search(self, content):
        search = content['query'].replace(' ', '').split(',')
        randomize = "random" in search
        sort = [i for i in search if i.startswith("s:")]
        fileType = [i for i in search if i.startswith(".")]
        sort = sort[0].split(":")[1:] if sort else None
        if sort and len(sort) < 2: sort.append("d")
        # score, width, height, time, tagCount, random
        sortGuide = {'s':"score",'w':"width",'h':"height",'t':"timestamp",'c':"tagCount",'r':"random"}
        with open('results.txt', 'r') as f:
            r = f.read()
            if r.split('\n')[0] == ','.join(search): 
                results = r.split('\n')[1:]
                self.send_json_response(200, results[RESULTS_PER_PAGE * int(content['page']):RESULTS_PER_PAGE * (int(content['page'])+1)])
                return
        results = filter_tags(search, int(content['page']))
        with open('results.txt', 'w') as f:
            f.write(','.join(search))
            f.write('\n')
            if sort:
                for i in sort[0][::-1]: 
                    if randomize or i.lower() == 'r': random.shuffle(results)
                    else:
                        sortType = sortGuide[i.lower()]
                        results.sort(key=lambda x: getImageData(x, sortType), reverse = sort[1][0] != 'a')
            if fileType:
                results = [i for i in results if os.path.splitext(i)[1].lower() in fileType]
            f.write('\n'.join(results))
        self.send_json_response(200, results[RESULTS_PER_PAGE * int(content['page']):RESULTS_PER_PAGE * (int(content['page'])+1)])
    
    def handle_save_tags(self, content):
        filename = os.path.join(UPLOAD_DIR, content['filename'].split('.')[0], "data.json")
        with open(filename, 'r') as f:
            data = json.load(f)
        data['tags']['0'] = content['0']
        data['tags']['1'] = content['1']
        data['tags']['2'] = content['2']
        data['tags']['tags'] = content['tags']
        data['data']['score'] = content['score']

        currentTags = data['tags']['0'] + data['tags']['1'] + data['tags']['2'] + data['tags']['tags']
        data['data']['tagCount'] = len(currentTags)
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        with open('allTags.txt', 'a+') as f:
            f.seek(0)
            allTags = f.read()
            for tag in currentTags:
                if tag.replace(' ', '') not in allTags.replace(' ', '').split('\n'):
                    f.write('\n' + tag)
        self.send_json_response(200, "success")
    
    def handle_last_page(self, content):
        count = len(os.listdir(UPLOAD_DIR))
        with open('results.txt', 'w') as f:
            f.write(str(time.time()))
        self.send_json_response(200, count//RESULTS_PER_PAGE)

    def handle_file_upload(self, data):
        current_time = time.time()
        filename = str(current_time).split('.')[0] + '_' + self.headers['File-Name'].replace(' ', '_').replace(',', '')
        if len(filename) > 60: 
            filename = filename[:40] + '.' + filename.split('.')[1]
        directory_name = os.path.splitext(filename)[0]
        directory_path = os.path.join(UPLOAD_DIR, directory_name)
        os.makedirs(directory_path, exist_ok=True)
        filepath = os.path.join(directory_path, filename)
        
        file_start = data.find(b'\r\n\r\n') + len(b'\r\n\r\n')
        file_content = data[file_start:]
        with open(filepath, 'wb') as f:
            f.write(file_content)
        if filepath.endswith('.jpg') or filepath.endswith('.png') or filepath.endswith('.webp') or filepath.endswith('.gif'):
            img = Image.open(filepath)
            img.thumbnail((250, 250))
            small_img_path = os.path.join(directory_path, 'small_' + filename)
            img.save(small_img_path)
            width, height = img.size
            if filepath.endswith('.gif'):
                puaseFrame = img.n_frames // 2
                img.seek(puaseFrame)
                rgbim = img.convert('RGB')
                rgbim.save(os.path.join(directory_path, 'pause_' + filename[:-4] + '.jpg'))
        elif filepath.endswith('.mp4'):
            cap = cv2.VideoCapture(filepath)
            cap.set(cv2.CAP_PROP_FPS, 30)
            ret, frame = cap.read()
            if ret:
                small_img_path = os.path.join(directory_path, 'small_' + directory_name + '.jpg')
                cv2.imwrite(small_img_path, frame)
                width, height, _ = frame.shape
            cap.release()
        jsonFile = os.path.join(directory_path, "data.json")
        with open(jsonFile, 'w') as f:
            json.dump({"data": {"score": 0,"type": "image" if filepath.endswith('.jpg') or filepath.endswith('.png') or filepath.endswith('.webp') or filepath.endswith('.gif') else "video",
                                "width": width,"height": height,"tagCount": 0,"timestamp": int(current_time)
                                },"tags": {"0": [], "tags": [], "1": [], "2": []}}, f, indent=4)
        # No content to write to tags.txt for file uploads
        
        redirect_url = f'/pictureEdit.html?filename={filename}'
        response_data = {
            'filename': filename,
            'size': len(file_content),
            'type': self.headers['Content-Type'],
            'Location': redirect_url
        }
        self.send_json_response(302, response_data)
    
    def handle_delete(self, content):
        filename = content.decode()
        directory_name = os.path.splitext(filename)[0]
        directory_path = os.path.join(UPLOAD_DIR, directory_name)
        for name in os.listdir(directory_path):
            os.remove(os.path.join(directory_path, name))
        os.rmdir(directory_path)
        self.send_json_response(200, filename)
    
    def handle_open_folder(self, content):
        filename = content.decode()
        folder = os.path.splitext(filename)[0]
        path = os.path.realpath(os.path.join(UPLOAD_DIR, folder))
        print(path, folder, filename)
        os.startfile(path)

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))  # Ensure encoding as UTF-8

Handler = CustomRequestHandler

url = "http://localhost:" + str(PORT) + "/index.html"
chrome_path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
subprocess.Popen([chrome_path, url])

# Create a threaded server instance
with ThreadedHTTPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    # Start a new thread for serving requests
    for i in range(5):
        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True  # Daemonize the thread so it exits when the main thread exits
        server_thread.start()
        # Wait for the server thread to finish (if ever)
        server_thread.join()
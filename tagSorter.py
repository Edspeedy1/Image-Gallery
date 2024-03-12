import os
import json

DIRECTORY = os.path.dirname(os.path.realpath(__file__))

def tagSorter():
    file = DIRECTORY + "\\allTags.txt"
    with open(file, 'r') as f:
        tags = f.read().split('\n')
        tags = [tag for tag in tags if tag != '']
        tags.sort()
        tags = '\n'.join(tags)
        with open(file, 'w') as f:
            f.write(tags)

def grabAllTags():
    l = []
    for root, dirs, files in os.walk(DIRECTORY + "\\uploads"):
        for i in files:
            if i == 'data.json':
                with open(os.path.join(root, i), 'r') as k:
                    data = json.load(k)
                    tags = data['tags']['0'] + data['tags']['1'] + data['tags']['2'] + data['tags']['tags']
                    l += tags
    print(len(l))
    s = set(l)
    print(len(s))
    l2 = [(i, l.count(i)) for i in s]
    print(len(l2))
    l2.sort(key=lambda x: x[1], reverse=True)
    print(len(l2))
    l = [i[0] for i in l2 if i[1] > 1]
    print(len(l))
    output_file_path = os.path.join(DIRECTORY, 'allTags.txt')
    with open(output_file_path, 'w') as f:
        f.write('\n'.join(l))
        print("Tags have been written to:", output_file_path)

grabAllTags()
# tagSorter()
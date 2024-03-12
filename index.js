document.addEventListener("DOMContentLoaded", () => {
    var fileInput = document.getElementById("file");
    const searchBar = document.getElementById("search");
    const lastPage = document.getElementById("lastPage");
    const port = new URL(window.location.href).port;
    const tagList = document.getElementById("myList");
    const suggestions = document.getElementById("suggestions");
    const maxSuggestions = 4;

    lastPage.addEventListener("click", () => {
        fetch('/lastPage', {
            method: 'POST',
            headers: {
                'conditionFlag': 'last_Page'
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            window.location.href = `http://localhost:${port}/search.html?page=` + data + "&search=";
        })
    })

    fetch('allTags.txt').then(response => response.text()).then(data => {
        allTags = data.split("\n")
        allTags.forEach(element => {
            let li = document.createElement("li");
            li.innerHTML = element;
            tagList.appendChild(li);
        })
    }).then(() => {
        var selectionNumber = -1;
        searchBar.addEventListener("keydown", (event) => {
            if (event.key == "Tab" || event.key == "Enter") {
                event.preventDefault();
                if (selectionNumber != -1) {
                    let node = suggestions.childNodes[selectionNumber];
                    if (node != undefined){
                        selectionNumber = -1;
                        node.click();
                    }
                }  else if (event.key == "Enter") {
                    window.location.href = `http://localhost:${port}/search.html?page=0&search=` + searchBar.value;
                }
            }
        })
    
        searchBar.addEventListener("keyup", (event) => {
            if (event.key == "ArrowDown") {
                if (selectionNumber != -1) {
                    let node = suggestions.childNodes[selectionNumber];
                    node.classList.remove("selected")
                }
                selectionNumber++;
                if (selectionNumber >= suggestions.childNodes.length) {
                    selectionNumber = suggestions.childNodes.length - 1;
                }
                node = suggestions.childNodes[selectionNumber];
                node.classList.add("selected")
                return
            }
            if (event.key == "ArrowUp") {
                let node = suggestions.childNodes[selectionNumber];
                node.classList.remove("selected")
                selectionNumber--;
                if (selectionNumber < 0) {
                    selectionNumber = 0;
                }
                node = suggestions.childNodes[selectionNumber];
                node.classList.add("selected")
                return
            }
            nextWord = searchBar.value.split(",").pop().trim();
            suggestions.innerHTML = "";
            let options = allTags.filter(tag => tag.toLowerCase().startsWith(nextWord.toLowerCase()))
            if (nextWord == "") {
                return
            }
            for (let i = 0; i < maxSuggestions; i++) {
                let li = document.createElement("li");
                let p = document.createElement("p");
                p.innerHTML = options[i];
                li.appendChild(p);
                if (options[i] != undefined){
                    li.onclick = liClicked
                    suggestions.appendChild(li);
                }
            }
        })
    })

    function liClicked(event) {
        let allWords = searchBar.value.split(",");
        let nextWord = allWords.pop().trim();
        nextWord = event.target.innerText + ", ";
        allWords.push(nextWord);
        searchBar.value = allWords.join(", ");
        suggestions.innerHTML = "";
        searchBar.focus();
    }
    
    document.getElementById("randomButton").addEventListener("click", () => {
        window.location.href = `http://localhost:${port}/search.html?page=0&search=s:r`;
    })

    fileInput.addEventListener("change", (event) => {
        const file = fileInput.files[0];
        const formData = new FormData(); // Create a new FormData object

        // Append the file to the FormData object
        formData.append('file', file);

        fetch(`http://localhost:${port}`, {
            method: 'POST',
            body: formData,
            headers: {
                'File-Name': file.name,
                'conditionFlag': 'upload_Image'
            }
        })
        .then(response => {
            return response.text(); // Return the response body (data)
        })
        .then(data => {
            data = JSON.parse(data);
            // console.log(data);
            window.location.href = data['Location'];
        })
        .catch(error => {
            console.error('Error:', error);
        });
    })

    var allButton = document.getElementById("allButton");
    allButton.addEventListener("click", () => {
        window.location.href = `http://localhost:${port}/search.html?page=0&search=`;
    })


})

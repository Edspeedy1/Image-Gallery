const urlParams = new URLSearchParams(window.location.search);
const port = new URL(window.location.href).port;
const searchTerm = urlParams.get('search');
const sideBar = document.getElementById("sideBar");
const searchBar = document.getElementById("searchBar");
const nextPage = document.getElementById("nextPage");
const previousPage = document.getElementById("prevPage");
const suggestions = document.getElementById("suggestions");
const tagList = document.getElementById("myList");
const maxSuggestions = 4;
var pageNum = urlParams.get('page');
var allTags;

nextPage.addEventListener("click", () => {
    if (document.getElementById("pictureGridContainer").childNodes.length > 28) {
        window.location.href = `http://localhost:${port}/search.html?page=` + (parseInt(pageNum) + 1) + "&search=" + searchTerm;
    }
})
previousPage.addEventListener("click", () => {
    window.location.href = `http://localhost:${port}/search.html?page=` + Math.max(parseInt(pageNum) - 1, 0) + "&search=" + searchTerm;
})

searchBar.value = searchTerm;
make_card = (element) => {
    // Each card has a picture or thumbnail and is placed in the pictureGridContainer
    let cardContainer = document.createElement('a');
    const card = document.createElement('div');
    card.classList.add('card');

    // Check the file extension to determine if it's a video or image
    const extension = element.split('.').pop().toLowerCase();

    // If it's a video file, generate a thumbnail
    const img = document.createElement('img');
    if (['mp4', 'webm', 'ogg'].includes(extension)) {
        img.src = "uploads/" + element.split(".")[0] + "/small_" + element.split(".")[0] + ".jpg";
        card.classList.add("vid-img-overlay");
    } else {
        img.src = "uploads/" + element.split(".")[0] + "/small_" + element;
    }
    
    img.classList.add('card-img');
    cardContainer.href = `http://localhost:${port}/picture.html?filename=` + element;

    card.appendChild(img);
    cardContainer.appendChild(card);
    document.getElementById("pictureGridContainer").appendChild(cardContainer);
};

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

function load_cards() {
    let encodedSearchTerm = encodeURIComponent(searchTerm);
    fetch(encodedSearchTerm, {
        method: 'POST',
        body: JSON.stringify({
            query:searchTerm,
            page:pageNum
        }),
        headers: {
            'conditionFlag': "search",
          }
    }).then(response => {
        return response.json();
    }).then(data => {
        data.forEach(element => {
            make_card(element)
        })
        if (data.length == 0 && pageNum != 0) {
            pageNum = pageNum - 1;
            window.location.href = `http://localhost:${port}/search.html?page=` + pageNum + "&search=" + searchTerm;
        }
    })
}

load_cards()
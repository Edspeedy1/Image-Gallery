const urlParams = new URLSearchParams(window.location.search);
const port = new URL(window.location.href).port;
const img = document.querySelector("img");
const tagList = document.querySelector("#tagList");
const filename = urlParams.get('filename').replace(' ', '_');
const directory = filename.substring(0, filename.lastIndexOf("."));
const searchBar = document.getElementById("searchBar");
const editButton = document.getElementById("editButton");
const expandButton = document.getElementById("hide-show-Button");
const pictureContainer = document.getElementById("pictureContainer");
const backButton = document.getElementById("backButton");
const nextPicture = document.getElementById("nextPicture");
const previousPicture = document.getElementById("previousPicture");
const scrollImage = document.getElementById('scrollImage');
const scoreCounter = document.getElementById("score");

let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;

// Event listener for mouse down
scrollImage.addEventListener('mousedown', (event) => {
	if (event.button !== 0) return;
	event.preventDefault();
    isDragging = true;
    startX = event.clientX - translateX;
    startY = event.clientY - translateY;
});

// Event listener for mouse move
scrollImage.addEventListener('mousemove', (event) => {
    if (isDragging) {
        translateX = event.clientX - startX;
        translateY = event.clientY - startY;
		var newScale = scrollImage.style.transform ? parseFloat(scrollImage.style.transform.split('(')[1]) : 1;
        scrollImage.style.transform = `scale(${newScale}) translate(${translateX}px, ${translateY}px)`;
    }
});

// Event listener for mouse up
scrollImage.addEventListener('mouseup', () => {
	if (event.button !== 0) return;
    isDragging = false;
});

// Event listener for mouse leave (to handle mouseup outside the image)
scrollImage.addEventListener('mouseleave', () => {
	if (event.button !== 0) return;
    isDragging = false;
});


pictureContainer.addEventListener('wheel', function(event) {
	event.preventDefault();
	var delta = -Math.sign(event.deltaY);
	
	// Get the current scale of the image
	var newScale = scrollImage.style.transform ? parseFloat(scrollImage.style.transform.split('(')[1]) : 1;
	if (delta > 0){newScale *= 1.25}
	else {newScale /= 1.25}
	// Set a minimum scale limit
	var minScale = 1; // Change this to the minimum scale you want
	if (newScale < minScale) {
		newScale = minScale;
	}
	translateX = 0;
	translateY = 0;
	// Apply the new scale to the image
	scrollImage.style.transform = `scale(${newScale}) translate(0px, 0px)`;;
});

// when the next picture button is clicked, send a request to the server
nextPicture.addEventListener("click", () => {
	fetch('/next', {
		method: 'POST',
		body: filename,
		headers: {
			conditionFlag: 'next_Image'
		}
	}).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then((data) => {
		window.location.href = `http://localhost:${port}/picture.html?filename=` + data;
	})
})
previousPicture.addEventListener("click", () => {
	fetch('/pre', {
		method: 'POST',
		body: filename,
		headers: {
			conditionFlag: 'pre_Image'
		}
	}).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then((data) => {
		window.location.href = `http://localhost:${port}/picture.html?filename=` + data;
	})
});


searchBar.addEventListener("keydown", (event) => {
	if (event.key == "Enter") {
		event.preventDefault();
		window.location.href = `http://localhost:${port}/search.html?page=0&search=` + searchBar.value;
	}
});

editButton.addEventListener("click", () => {
	window.location.href = `http://localhost:${port}/pictureEdit.html?filename=` + filename;
})

expandButton.addEventListener("click", () => {
    if (sideBar.classList.contains("out")) {
        sideBar.classList.remove("out");
        sideBar.classList.add("in");
		pictureContainer.classList.remove("in");
		pictureContainer.classList.add("out");
		previousPicture.classList.remove("in");
		previousPicture.classList.add("out");
        expandButton.textContent = '-';
    } else {
        sideBar.classList.remove("in");
        sideBar.classList.add("out");
		pictureContainer.classList.remove("out");
		pictureContainer.classList.add("in");
		previousPicture.classList.remove("out");
		previousPicture.classList.add("in");
        expandButton.textContent = '+';
    }
})
backButton.addEventListener("click", () => {
	// goes back to the search page (search is saved in results.txt)
	fetch("results.txt", {
		method: "POST",
		headers: {
			'conditionFlag': "go_Back",
		}
	}).then(response => {
		return response.json();
	}).then(data => {
		window.location.href = `http://localhost:${port}/search.html?page=0&search=` + data;
	})
})


if (filename.substring(filename.lastIndexOf(".") + 1) == "jpg" || filename.substring(filename.lastIndexOf(".") + 1) == "png" || filename.substring(filename.lastIndexOf(".") + 1) == "gif" || filename.substring(filename.lastIndexOf(".") + 1) == "webP") {
	img.alt = filename;
	var largeImg = new Image();
	img.src = "uploads/" + directory + "/small_" + filename;
	largeImg.src = "uploads/" + directory + "/" + filename;
	largeImg.onload = function() {
		img.src = largeImg.src;
	}
	if (filename.substring(filename.lastIndexOf(".") + 1) == "gif"){
		var pauseButton = document.createElement("button");
		pauseButton.textContent = "||";
		pauseButton.classList.add("pauseButton");
		pictureContainer.appendChild(pauseButton);
		pauseButton.addEventListener("click", () => {
			if (pauseButton.textContent == "||"){
				pauseButton.textContent = ">";
				img.src = "uploads/" + directory + "/pause_" + filename.replace(".gif", ".jpg");
			} else {
				pauseButton.textContent = "||";
				img.src = largeImg.src;
			}
		})
	}

} else {
    const video = document.createElement("video");
    video.loop = true;
    video.src = "uploads/" + directory + "/" + filename;

    // Wait for metadata to be loaded before enabling controls
    video.addEventListener("loadedmetadata", function() {
        video.setAttribute("controls", true);
    });

    img.replaceWith(video);
}

function makeTagListElement(type, element) {
	if (element == "") {
		return;
	}
	let li = document.createElement("li");
	let a = document.createElement("a");
	a.href = `http://localhost:${port}/search.html?page=0&search=` + element;
	a.innerText = element;
	a.classList.add("tag");
	a.classList.add(type);
	li.appendChild(a);
	tagList.appendChild(li);
}


// Read the text file associated with the image
fetch('uploads/' + directory + '/data.json')
.then(response => response.json())
.then(data => {
	scoreCounter.textContent = "Score: " + data["data"]["score"];
	data["tags"]["0"].forEach(element => {
		makeTagListElement("t0", element);
	})
	data["tags"]["1"].forEach(element => {
		makeTagListElement("t1", element);
	})
	data["tags"]["2"].forEach(element => {
		makeTagListElement("t2", element);
	})
	data["tags"]["tags"].forEach(element => {
		makeTagListElement("generalTag", element);
	})
})
.catch(error => console.error('Error:', error));

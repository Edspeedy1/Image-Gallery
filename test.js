const urlParams = new URLSearchParams(window.location.search);
const port = new URL(window.location.href).port;
const img = document.querySelector("img");
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


if (filename.substring(filename.lastIndexOf(".") + 1) == "jpg" || filename.substring(filename.lastIndexOf(".") + 1) == "png" || filename.substring(filename.lastIndexOf(".") + 1) == "gif" || filename.substring(filename.lastIndexOf(".") + 1) == "webP") {
	img.src = "uploads/" + directory + "/" + filename;
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


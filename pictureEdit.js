const img = document.querySelector("img");
const tagList = document.querySelector("#tagList");
const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('filename').replace(' ', '_');
const directory = filename.substring(0, filename.lastIndexOf("."));
const doneButton = document.getElementById("doneButton");
const deleteButton = document.getElementById("deleteButton");
const folderButton = document.getElementById("folderButton");
const port = new URL(window.location.href).port;
const textarea = Array.from(document.getElementsByClassName("tagInput"));
const scoreCounter = document.getElementById("scoreCounter");

function removeEndingWhitespace(word) {
    // This regex matches whitespace characters (\s+) at the end of the string ($).
    return word.replace(/\s+$/, '');
}

folderButton.addEventListener("click", () => {
	fetch('/openFolder', {
		method: 'POST',
		body: filename,
		headers: {
			conditionFlag: 'open_Folder'
		}
	}).then(response => {
		return response.json();
	})
})

deleteButton.addEventListener("click", () => {
	fetch('/delete', {
		method: 'POST',
		body: filename,
		headers: {
			conditionFlag: 'delete_Image'
		}
	}).then(response => {
		return response.json();
	}).then(data => {
		window.location.href = `http://localhost:${port}/search.html?page=0&search=`;
		
	})
})

doneButton.addEventListener("click", () => {
	saveFunction.call(doneButton);
	window.location.href = `http://localhost:${port}/picture.html?filename=` + filename
})

textarea.forEach(element => {
	element.addEventListener("input", function () {
		this.style.height = "auto";
		this.style.height = (this.scrollHeight) + "px";
	});
});
var adjustTextarea = function () {
	this.style.height = "auto";
	this.style.height = (this.scrollHeight) + "px";
};

if (filename.substring(filename.lastIndexOf(".") + 1) == "jpg" || filename.substring(filename.lastIndexOf(".") + 1) == "png" || filename.substring(filename.lastIndexOf(".") + 1) == "gif" || filename.substring(filename.lastIndexOf(".") + 1) == "webP") {
	img.src = "uploads/" + directory + "/" + filename;
} else {
	const video = document.createElement("video");
	video.setAttribute("controls", true);
	video.loop = true;
	video.src = "uploads/" + directory + "/" + filename;
	img.replaceWith(video);
}

// Read the text file associated with the image
fetch('uploads/' + directory + '/data.json')
	.then(response => response.json())
	.then(data => {
		scoreCounter.value = parseInt(data["data"]["score"]);
		textarea[0].textContent = Array.from(data["tags"]["0"]).join('\n');
		textarea[1].textContent = Array.from(data["tags"]["1"]).join('\n');
		textarea[2].textContent = Array.from(data["tags"]["2"]).join('\n');
		textarea[3].textContent = Array.from(data["tags"]["tags"]).join('\n');
		adjustTextarea.call(textarea[0]);
		adjustTextarea.call(textarea[1]);
		adjustTextarea.call(textarea[2]);
		adjustTextarea.call(textarea[3]);
	})
	.catch(error => console.error('Error:', error));
textarea.forEach(element => element.addEventListener("input", adjustTextarea));


var saveButton = document.getElementById("saveButton");
var saveFunction = function () {
	var text0 = Array.from(textarea[0].value.split("\n")).map(word => {return removeEndingWhitespace(word);})
	var text1 = Array.from(textarea[1].value.split("\n")).map(word => {return removeEndingWhitespace(word);})
	var text2 = Array.from(textarea[2].value.split("\n")).map(word => {return removeEndingWhitespace(word);})
	var generalText = Array.from(textarea[3].value.split("\n")).map(word => {return removeEndingWhitespace(word);})

	tagAmount = text0.length + text1.length + text2.length + generalText.length;
	fetch('/save', {
		method: 'POST',
		body: JSON.stringify({
			"filename": filename,
			"amount": tagAmount,
			"score": scoreCounter.value,
			"0": text0,
			"1": text1,
			"2": text2,
			"tags": generalText
		}),
		headers: {
			'conditionFlag': "save_Tags",
		}
	})
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(data => {
			console.log('Data saved successfully:', data);
		})
		.catch(error => {
			console.error('Error saving data:', error);
		});
}
saveButton.addEventListener("click", saveFunction)


document.addEventListener("keydown", function (event) {
	if (event.ctrlKey && event.key === 's') {
		event.preventDefault();
		saveFunction.call(saveButton);
	}
});
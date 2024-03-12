// Get the drop zone and file input element
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file');
const port = new URL(window.location.href).port;

// Prevent default behavior for drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight the drop zone when dragging over it
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

// Remove highlight when dragging leaves the drop zone
['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});


// Function to prevent default behavior for drag and drop events
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Function to highlight the drop zone when dragging over it
function highlight() {
    dropZone.style.background = 'lightgray';
}

// Function to remove highlight when dragging leaves the drop zone
function unhighlight() {
    dropZone.style.background = '';
}

// Function to handle the drop event
// Function to handle the drop event
function handleDrop(event) {
    const files = event.dataTransfer.files;

    // If files were dropped, handle them
    if (files.length > 0) {
        const file = files[0];
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
    }
}

// Handle drop event
dropZone.addEventListener('drop', handleDrop, false);


// Function to handle dropped files
function handleFiles(files) {
    // Loop through dropped files
    for (const file of files) {
        // Check if dropped file is an image or video
        if (file.type.startsWith('image/')) {
            // Display the dropped image
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                dropZone.appendChild(img);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            // Display the dropped video
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            dropZone.appendChild(video);
        } else {
            alert('Please drop an image or video file.');
        }
    }
}

// Open file input when drop zone is clicked
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Handle selected files when file input changes
fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length > 0) {
        handleFiles(files);
    }
});

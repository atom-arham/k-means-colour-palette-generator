const file_input = document.getElementById('file-input');
const image_preview = document.getElementById('image-preview');
const no_image_text = document.getElementById('no-image-msg');
const upload_form = document.getElementById('upload-form');
const canvas = document.getElementById('canvas');
const output = document.getElementById('output-text');

const COLOUR_CODES =[];
//preview

file_input.addEventListener('change', function(){
    const file = this.files[0];
    if(file){
        const objectURL = URL.createObjectURL(file);
        image_preview.src = objectURL;

        image_preview.onload = function(){
            image_preview.style.display = 'block';
            no_image_text.style.display = 'none';
        }
        
    }
})

upload_form.addEventListener('submit', function(e){
    e.preventDefault();

    if(!file_input.files[0]){
        alert("Please upload an image first");
        return;
    }

    const k = parseInt(document.getElementById('colourCount').value);
    const downscale = downscaleImage(image_preview);
    const pixel_array = pixelToArray(downscale);
    const centroids = kmeans(pixel_array, k);

    let c = centroids.centroids
    let hex = [];

    for (let i=0; i < c.length; i++){
        let col = rgbToHex(c[i][0],c[i][1],c[i][2])

        hex.push(col);
    }

    console.log(centroids.centroids)
    //output.textContent = "Found Centers of "+ centroids.centroids.length + " colours " + c;
    //output.textContent = "Found Centers of "+ centroids.centroids.length + " colours " + hex;

    //COLOUR_CODES = hex;

    output.innerHTML = "";
    const title = document.createElement('p');
    title.textContent = "Colours";
    output.appendChild(title);

    const palette_canvas = createPaletteCanvas(hex);
    
    output.appendChild(palette_canvas);

    palette_canvas.style.cursor = 'pointer';
    palette_canvas.addEventListener('click', async function(event){
        const rect = palette_canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const sectionWidth = palette_canvas.width/ hex.length;
        const clickedIndex = Math.floor(clickX/sectionWidth);
        const clickedHex = hex[clickedIndex];

        try {
            await navigator.clipboard.writeText(clickedHex);
            title.textContent = `Copied: ${clickedHex} to Clipboard`;
            setTimeout(() =>{
                title.textContent = "COLOURS";
            },1500);
        } catch (err){
            console.error("Failed to copy text:", err);
            title.textContent = "Error Copying to Clipboard";
        }
    });

});


function downscaleImage(image){
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', {willReadFrequently: true});

    const newWidth = Math.floor(image.naturalWidth/4);
    const newHeight = Math.floor(image.naturalHeight/4);

    canvas.width = newWidth;
    canvas.height = newHeight;

    context.drawImage(image,0,0,newWidth, newHeight);

    return canvas;
}

function pixelToArray(canvas){
    const context = canvas.getContext('2d', {willReadFrequently: true});

    const image_data = context.getImageData(0,0, canvas.width,canvas.height).data;
    
    let pixel = flatten(image_data);

    return pixel;
}

function flatten(image_data){
    let pixels = [];

    for (let i=0; i < image_data.length; i+=4){
        pixels.push([image_data[i],image_data[i+1],image_data[i+2]]);
    }

    return pixels;
}


function deciToHex(num){
    let rounded = Math.round(num);
    let clamped = Math.max(0,Math.min(255, rounded))

    let hex = clamped.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r,g,b){
    return "#" + deciToHex(r) + deciToHex(g) + deciToHex(b);
}




function createPaletteCanvas(hexArray){
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 600;
    canvas.height = 100;

    const k = hexArray.length;
    const section = canvas.width/k

    for (let i=0; i<k ; i++){
        const hex = hexArray[i];
        const startX = i*section;

        context.fillStyle = hex;
        context.fillRect(startX,0,section,canvas.height);

        context.font = 'bold 16px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        const textX = startX + (section/2);
        const textY = canvas.height/2;

        context.strokeStyle = 'black';
        context.lineWidth = 4;
        context.strokeText(hex,textX,textY);
        context.fillStyle = 'white';
        context.fillText(hex,textX, textY);
    }

    return canvas;
}
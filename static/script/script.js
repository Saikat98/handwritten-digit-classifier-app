// getting elements
const canvas = document.getElementById("drawing-board");
const banner = document.getElementById("try-again");
const ctx = canvas.getContext("2d");
const clear_btn = document.getElementById("clear-btn");
const pred_btn = document.getElementById("pred-btn");
const form = document.getElementById('form');
const instructions_close = document.getElementById("instructions-close");

// setting canvas drawing & prediction specification
let canvasOffsetX = canvas.offsetLeft;
let canvasOffsetY = canvas.offsetTop;
const strokeColor = "#FFFFFF"; // white is 255
const padding = 7;
canvas.width = 200;
canvas.height = 200;
let isPainting = false;
let lineWidth = 22; // adjust based on model training images
const pixel_thresh = 50; // pixel threshold above which predict button is enabled
let startX;
let startY;
const prediction_prob_thresh = 0.3; // probablity threshold above which prediction is displayed

// close the instructions shown in the begining
instructions_close.addEventListener("click", () => {
    document.getElementById("instructions").style.display = "none";
});

// this function resizes the 200x200 image to 28x28 for model use
function resizeImage(img, width, height) {
    var canvas_small = document.createElement('canvas');
    var ctx_small = canvas_small.getContext('2d');
    canvas_small.width = width;
    canvas_small.height = height;
    ctx_small.drawImage(img, 0, 0, width, height);
    var smallImageData = ctx_small.getImageData(0,0, width, width);
    return smallImageData;
}

// this function extracts a single channel pixel data
// image data is present as [R1,G1,B1,aplha1,R2,G2,B2,alpha2...]
// and for our case we can just go ahead and use red channel data
function getPixelData(img, width, height) {
    var r_channel_data = [];
    var imgData = resizeImage(img, width, height);
    for (i=0; i<imgData.data.length; i+=4) {
        r_channel_data.push(imgData.data[i]);
    }
    return r_channel_data;
}

// on clicking predict button the canvas image data should
// be send to the server and the server will predict using that
// and send back the prediction to the client
pred_btn.addEventListener('click', e => {
    e.preventDefault();
    var pixel_data = getPixelData(canvas, 28, 28);
    fetch('/predict', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({pixel_data:pixel_data})
    })
    .then(response => response.json())
    .then(data => {
        var prediction_prob_max = Math.round(Math.max(...data.prediction_prob)*100)/100;
        if (prediction_prob_max>=prediction_prob_thresh) {
            console.log(`Success: Class (${data.prediction_class}) | Prediction probability (${prediction_prob_max})`);
            var progressBars = document.querySelectorAll('.progress-bar-fill');
            for (let i=0; i<progressBars.length; i++) {
                progressBars[i].style.width = `${data.prediction_prob[i]*100}%`;
            }
            setTimeout(function() {
                document.querySelectorAll('.progress-bar')[data.prediction_class].classList.add("pred-label");
            }, 200)
        } else {
            console.log(`Failed: Class (${data.prediction_class}) | Prediction probability (${prediction_prob_max})`);
            banner.style.display = 'block';
            clear_btn.classList.add("clear-btn-try-again");
            clear_btn.innerHTML = "Try Again";
            pred_btn.disabled = true;
            pred_btn.classList.remove("enabled");
        }
    })
    .catch(error => {
        console.error(error);
    });
});

// on clicking the clear button the canvas is cleared and
// CSS elements are restored back
clear_btn.addEventListener('click', e => {
    e.preventDefault();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    var progressBars = document.querySelectorAll('.progress-bar-fill');
    for (let i = 0; i < progressBars.length; i++) {
        progressBars[i].style.width = `${0}%`;
        document.querySelectorAll('.progress-bar')[i].classList.remove("pred-label");
    }
    banner.style.display = 'none';
    clear_btn.classList.remove("clear-btn-try-again");
    clear_btn.innerHTML = "Clear";
    pred_btn.disabled = true
    pred_btn.classList.remove("enabled");
});

// the code below enables user to draw on the canvas
canvas.addEventListener("mousedown", (e) => {
    isPainting = true;
    startX = e.clientX;
    startY = e.clientY;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener("mouseup", (e) => {
    isPainting = false;
    ctx.stroke()
    ctx.beginPath();
    canvas.style.cursor = 'auto';
});

canvas.addEventListener('mousemove', (e) => {
    var banner_display = window.getComputedStyle(banner).getPropertyValue("display");
    if (!isPainting || banner_display!="none") {
        return;
    } else {
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = strokeColor
        ctx.lineTo(e.clientX - canvasOffsetX - padding,e.clientY- canvasOffsetY - padding);
        ctx.stroke();
    } 
});

canvas.addEventListener('mouseout', (e) => {
    isPainting = false;
    canvas.style.cursor = 'auto';
});

// the code below enables the predict button
// if the pixel points count is more than 70 then allow it
function predEnabler() {
    var count = 0;
    var pixel_data = getPixelData(canvas, 28, 28)
    for (let i=0; i<pixel_data.length; ++i) {
        if (pixel_data[i]==255) {
            count += 1
        }
    }
    var banner_display = window.getComputedStyle(banner).getPropertyValue("display");
    if (count>pixel_thresh && banner_display=="none") {
        pred_btn.disabled = false
        pred_btn.classList.add("enabled");
    }
}

canvas.addEventListener("mouseup", predEnabler);
canvas.addEventListener("mouseout", predEnabler);

// Set up an event listener to handle window resize events
window.addEventListener('resize', () => {
    canvasOffsetX = canvas.offsetLeft;
    canvasOffsetY = canvas.offsetTop;
});
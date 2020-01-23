let video;
let poseNet;
let noseX = 0;
let noseY = 0;
let eyelX = 0;
let eyelY = 0;
let pose;

var myAsciiArt;
var asciiart_width = 240; var asciiart_height = 120;
var asciiart_scale = 4;
/*
Buffer for processed graphics, simplifying some operations. This will be an
object derived from the p5.Graphics class
*/
var gfx;
var showOryginalImageFlag = true;
let maxFontSize;
let xRescale;
let yreScale;

let mic;
var asciiartOn = true;

function setup() {
    createCanvas(windowWidth, windowHeight);
    video = createCapture(VIDEO);
    video.size(1280/2, 720/2);
    video.elt.setAttribute('playsinline', '');
    video.hide();
    
    // ASCII art
    myAsciiArt = new AsciiArt(this);
    textAlign(CENTER, CENTER); textFont('monospace', 8); textStyle(NORMAL);
    noStroke(); fill(255);
    gfx = createGraphics(width, height);
    gfx.pixelDensity(1);
    maxFontSize = width/asciiart_width*1.5;
    xRescale = width/video.width;
    yRescale = height/video.height;

    // Create an Audio input
    mic = new p5.AudioIn();
    mic.start();
    
    // ML5
    poseNet = ml5.poseNet(video, modelReady);
    poseNet.on('pose', gotPoses);
}

function gotPoses(poses) {
    // console.log(poses);
    if (poses.length > 0) {
        pose = poses[0];
        let nX = poses[0].pose.keypoints[0].position.x;
        let nY = poses[0].pose.keypoints[0].position.y;
        let eX = poses[0].pose.keypoints[1].position.x;
        let eY = poses[0].pose.keypoints[1].position.y;
        noseX = lerp(noseX, nX, 0.5);
        noseY = lerp(noseY, nY, 0.5);
        eyelX = lerp(eyelX, eX, 0.5);
        eyelY = lerp(eyelY, eY, 0.5);
    }
}

function modelReady() {
    console.log('model ready');
}

function draw() {
    background(0);

    translate(width, 0);
    scale(-1.0, 1.0);    // flip x-axis backwards

    if (showOryginalImageFlag) image(video, 0, 0);

    // draw ML5

    let d = dist(noseX, noseY, eyelX, eyelY);

    noFill();
    strokeWeight(5);
    stroke(0, 255, 120);
    ellipse(noseX*xRescale/2, noseY*yRescale/2, d*5);
    if (pose != undefined) {
        for (var i = 0; i < pose.pose.keypoints.length; i++) {
            ellipse(pose.pose.keypoints[i].position.x, pose.pose.keypoints[i].position.y, 20);
        }
        for (var i = 0; i < pose.skeleton.length; i++) {
            line(pose.skeleton[i][0].position.x, pose.skeleton[i][0].position.y, pose.skeleton[i][1].position.x, pose.skeleton[i][1].position.y);
        }
    }
    
    if (asciiartOn) {
        // draw some ASCII art
        gfx.background(0);
        gfx.image(video, 0, 0, gfx.width, gfx.height);
        /*
        It is worth experimenting with the value of the parameter defining the
        level of posterization. Depending on the characteristics of the image,
        different values may have the best effect. And sometimes it is worth not
        to apply the effect of posterization on the image.
        */
        gfx.filter(POSTERIZE, map(mouseY, 0, height, 3, 60));
        // textFont('monospace', map(mic.getLevel(), 0, 1, 4, 20));
        
        textFont('monospace', map(mouseX, 0, width, 2, maxFontSize));
        ascii_arr = myAsciiArt.convert(gfx);
        myAsciiArt.typeArray2d(ascii_arr, this);
    }

    copy(video.width, 0, video.width, video.height, width, 0, width, height);


}

function mouseReleased() {    
    showOryginalImageFlag = !showOryginalImageFlag;
}
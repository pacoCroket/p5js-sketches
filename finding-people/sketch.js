let cnv;
let video;
let poseNet;
let poses = [];
let prevFace;

var myAsciiArt;
var asciiart_width = 80; var asciiart_height = 50;
/*
Buffer for processed graphics, simplifying some operations. This will be an
object derived from the p5.Graphics class
*/
var gfx;
let maxFontSize;
let xRescale;
let yreScale;
let mic;

var asciiartOn = true;
var showOryginalImageFlag = true;
let mirror = false;
let invert = false;
let lerpAmount = 0.4;

function setup() {
    cnv = createCanvas(1280, 960);
    cnv.parent("#sketch");
    cnv.class("center");

    video = createCapture(VIDEO);
    video.size(640, 480);
    video.elt.setAttribute('playsinline', '');
    video.hide();
    
    // ASCII art
    myAsciiArt = new AsciiArt(this);
    textAlign(CENTER, CENTER);
    // textFont('monospace', 8);
    textStyle(NORMAL);
    gfx = createGraphics(asciiart_width, asciiart_height);
    gfx.pixelDensity(1);
    maxFontSize = (width/asciiart_width + height/asciiart_height)/2;
    xRescale = width/video.width;
    yRescale = height/video.height;

    // Create an Audio input
    mic = new p5.AudioIn();
    mic.start();
    
    // ML5
    poseNet = ml5.poseNet(video, 'single', modelReady);
    poseNet.on('pose', gotPoses);
    strokeCap(ROUND);
    // blendMode(DIFFERENCE); // trippy
    blendMode(HARD_LIGHT); // nice darkened colors
}

function gotPoses(results) {
    poses = results;
}

function modelReady() {
    console.log('model ready');
}

function draw() {
    background(0);

    if (mirror) {
        translate(width, 0);
        scale(-1.0, 1.0);    // flip x-axis backwards
    }

    if (showOryginalImageFlag) {
        image(video, 0, 0, width, height);
        if (invert) filter(INVERT);
    }
    
    if (asciiartOn) drawAscii();

    if (poses != undefined && poses.length > 0) drawPoses();


    // Paco Croket tag
    push();
    noStroke();
    fill(0);  
    translate(width/2, height);
    rect(-100, -40, 200, 40)
    fill(255);  
    textFont('monospace', 25);
    translate(0, -20);
    text('@pacoCroket', 0, 0);
    pop();
    push();
    noStroke();
    fill(0);  
    translate(width/2, 0);
    rect(-100, 0, 200, 40)
    fill(255);  
    textFont('monospace', 25);
    translate(0, 20);
    text('@pacoCroket', 0, 0);
    pop();
}

function drawPoses() {
 // for (var i = 0; i < poses.length; i++) { 
    let pose = poses[0];  

    if (pose != undefined) {         
        // for (var i = 0; i < pose.pose.keypoints.length; i++) {
        //     ellipse(pose.pose.keypoints[i].position.x*xRescale, pose.pose.keypoints[i].position.y*yRescale, 20);
        // }
        stroke(255);
        strokeWeight(10);
        for (var i = 0; i < pose.skeleton.length; i++) {
            line(pose.skeleton[i][0].position.x*xRescale, pose.skeleton[i][0].position.y*yRescale, pose.skeleton[i][1].position.x*xRescale, pose.skeleton[i][1].position.y*yRescale);
        }

        // face 
        let nose = createVector(pose.pose.keypoints[0].position.x, pose.pose.keypoints[0].position.y);
        let el = createVector(pose.pose.keypoints[1].position.x, pose.pose.keypoints[1].position.y);
        let er = createVector(pose.pose.keypoints[2].position.x, pose.pose.keypoints[2].position.y);

        if (prevFace != undefined) {
            nose = p5.Vector.lerp(nose, prevFace[0], lerpAmount);
            el = p5.Vector.lerp(el, prevFace[1], lerpAmount);
            er = p5.Vector.lerp(er, prevFace[2], lerpAmount);
        } 

        prevFace = [nose, el, er];
        
        let btwEyes = p5.Vector.sub(el, er);
        let d = p5.Vector.dist(nose, el);

        // circle ovr head
        if (d*10 < 600) {
            fill(0, 80);
            push();
            translate(nose.x*xRescale, nose.y*yRescale-d);
            rotate(btwEyes.heading());
            ellipse(0, 0, d*8*map(mic.getLevel(), 0, 1, 1, 0.6), d*10*map(mic.getLevel(), 0, 1, 1, 1.5));
            pop();
        }

        // black crosses on the eyes
        stroke(0);
        strokeWeight(d*0.6);
        // left eye
        drawCross(el.x*xRescale, el.y*yRescale, btwEyes)
        // right eye
        drawCross(er.x*xRescale, er.y*yRescale, btwEyes)

    }
}

function drawAscii() {
    noStroke();
    fill(invert?0:255);  
    // draw some ASCII art
    gfx.background(0);
    gfx.image(video, 0, 0, gfx.width, gfx.height);
    /*
    It is worth experimenting with the value of the parameter defining the
    level of posterization. Depending on the characteristics of the image,
    different values may have the best effect. And sometimes it is worth not
    to apply the effect of posterization on the image.
    */
    // let posterize = map(mouseY, 50, height, 2, 60);
    // posterize = constrain(posterize, 2, 60);
    // gfx.filter(POSTERIZE, posterize);
    gfx.filter(POSTERIZE, 10);
    // gfx.filter(INVERT);
    // textFont('monospace', map(mic.getLevel(), 0, 1, 4, 20));
    
    // textFont('monospace', map(mouseX, 0, width, 2, maxFontSize));
    textFont('monospace', maxFontSize);
    ascii_arr = myAsciiArt.convert(gfx);
    myAsciiArt.typeArray2d(ascii_arr, this);
}

function drawCross(x, y, btwEyes) {
    let l = btwEyes.mag()*0.8;
    let eyeAngle = btwEyes.heading();
    push();
    translate(x, y);
    rotate(-PI/4 + eyeAngle);
    line(-l, 0, l, 0);
    rotate(PI/2 + eyeAngle);
    line(-l, 0, l, 0);
    pop();
}

function mouseReleased() {    
    showOryginalImageFlag = !showOryginalImageFlag;
}
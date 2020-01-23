let cnv;
let video;
let poseNet;
let poses = [];

var myAsciiArt;
var asciiart_width = 80; var asciiart_height = 60;
var asciiart_scale = 4;
/*
Buffer for processed graphics, simplifying some operations. This will be an
object derived from the p5.Graphics class
*/
var gfx;
var showOryginalImageFlag = false;
let maxFontSize;
let xRescale;
let yreScale;

let mic;
var asciiartOn = true;

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
    textAlign(CENTER, CENTER); textFont('monospace', 8); textStyle(NORMAL);
    gfx = createGraphics(asciiart_width, asciiart_height);
    gfx.pixelDensity(1);
    maxFontSize = width/asciiart_width*1.5;
    xRescale = width/video.width;
    yRescale = height/video.height;

    // Create an Audio input
    mic = new p5.AudioIn();
    mic.start();
    
    // ML5
    poseNet = ml5.poseNet(video, 'multiple', modelReady);
    poseNet.on('pose', gotPoses);
    strokeCap(ROUND);
}

function gotPoses(results) {
    poses = results;
}

function modelReady() {
    console.log('model ready');
}

function draw() {
    background(0);

    translate(width, 0);
    scale(-1.0, 1.0);    // flip x-axis backwards

    if (showOryginalImageFlag) image(video, 0, 0, width, height);

    noStroke();
    fill(255);   
    
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
        // let posterize = map(mouseY, 50, height, 2, 60);
        // posterize = constrain(posterize, 2, 60);
        // gfx.filter(POSTERIZE, posterize);
        gfx.filter(POSTERIZE, 4);
        gfx.filter(INVERT);
        // textFont('monospace', map(mic.getLevel(), 0, 1, 4, 20));
        
        // textFont('monospace', map(mouseX, 0, width, 2, maxFontSize));
        textFont('monospace', 11);
        ascii_arr = myAsciiArt.convert(gfx);
        myAsciiArt.typeArray2d(ascii_arr, this);
    }

    // circle over head reacting to mic


    // skeleton and eyes
    if (poses != undefined && poses.length > 0) {
        // for (var i = 0; i < poses.length; i++) { 
            let pose = poses[0];  

            if (pose != undefined) {         
                // for (var i = 0; i < pose.pose.keypoints.length; i++) {
                //     ellipse(pose.pose.keypoints[i].position.x*xRescale, pose.pose.keypoints[i].position.y*yRescale, 20);
                // }
                stroke(255);
                strokeWeight(6);
                for (var i = 0; i < pose.skeleton.length; i++) {
                    line(pose.skeleton[i][0].position.x*xRescale, pose.skeleton[i][0].position.y*yRescale, pose.skeleton[i][1].position.x*xRescale, pose.skeleton[i][1].position.y*yRescale);
                }

                // face
                let nose = createVector(pose.pose.keypoints[0].position.x, pose.pose.keypoints[0].position.y);
                let el = createVector(pose.pose.keypoints[1].position.x, pose.pose.keypoints[1].position.y);
                let er = createVector(pose.pose.keypoints[2].position.x, pose.pose.keypoints[2].position.y);
                
                let d = p5.Vector.dist(nose, el);

                // circle ovr head
                fill(0, 130);
                push();
                translate(nose.x*xRescale, nose.y*yRescale-d);
                let btwEyes = p5.Vector.sub(el, er);
                rotate(btwEyes.heading());
                ellipse(0, 0, d*8*map(mic.getLevel(), 0, 1, 1, 0.6), d*10*map(mic.getLevel(), 0, 1, 1, 1.5));
                pop();

                // black crosses on the eyes
                stroke(0);
                strokeWeight(d*0.6);
                // left eye
                drawCross(el.x*xRescale, el.y*yRescale, d*0.7)
                // right eye
                drawCross(er.x*xRescale, er.y*yRescale, d*0.7)

            }
        }
    // }
}

function drawCross(x, y, l) {
    push();
    translate(x, y);
    rotate(PI/4);
    line(-l, 0, l, 0);
    rotate(PI/2);
    line(-l, 0, l, 0);
    pop();
}

function mouseReleased() {    
    showOryginalImageFlag = !showOryginalImageFlag;
}